import { createHash } from 'node:crypto';
import {
  AppError,
  generateSecretToken,
  hmacToken,
  lookupTokenDigest,
  type AuthMethod,
  type AuthStrength,
  type OpsRole,
  type TokenKeyring,
} from '@paid/contracts';
import { newId } from '@paid/domain';
import { getSql } from './client';

function effectiveAuthStrength(
  method: AuthMethod,
  strength: AuthStrength,
  stepUpExpiresAt: Date | null,
  now: Date,
): AuthStrength {
  if (strength === 'STEP_UP' && stepUpExpiresAt && stepUpExpiresAt <= now) {
    return method === 'PASSKEY' ? 'PASSKEY' : 'EMAIL_LINK';
  }
  return strength;
}

export const LOCAL_DEV_CREATOR_SESSION = 'local-dev-creator-session-v1';
export const LOCAL_DEV_OPS_SESSION = 'local-dev-ops-session-v1';
export const LOCAL_DEV_OPS_STEPUP_SESSION = 'local-dev-ops-stepup-session-v1';
export const LOCAL_DEV_MAGIC_TOKEN = 'local-dev-magic-link-token-v1';

export function emailDigest(email: string): string {
  return createHash('sha256').update(email.trim().toLowerCase()).digest('hex');
}

export type SessionKind = 'CREATOR' | 'OPS';

export type MagicPurpose = 'MAGIC_LINK' | 'MAGIC_LINK_OPS';

export function magicLinkPurpose(kind: SessionKind): MagicPurpose {
  return kind === 'OPS' ? 'MAGIC_LINK_OPS' : 'MAGIC_LINK';
}

export type SessionRow = {
  id: string;
  userId: string;
  creatorId: string | null;
  kind: SessionKind;
  expiresAt: Date;
  opsRoles: OpsRole[];
  authMethod: AuthMethod;
  authStrength: AuthStrength;
  stepUpExpiresAt: Date | null;
  revokedAt: Date | null;
};

export async function issueMagicLink(input: {
  email: string;
  keyring: TokenKeyring;
  ttlMs: number;
  kind: SessionKind;
  now?: Date;
}): Promise<{ stored: boolean; token?: string }> {
  const sql = getSql();
  const now = input.now ?? new Date();
  const email = input.email.trim().toLowerCase();
  const digest = emailDigest(email);
  const users = await sql`SELECT id, staff_role FROM users WHERE lower(email) = ${email}`;
  if (users.length === 0) return { stored: false };
  const user = users[0] as { id: string; staff_role: string | null };
  const userId = String(user.id);
  if (input.kind === 'OPS') {
    if (!user.staff_role) return { stored: false };
  } else {
    const creators = await sql`SELECT id FROM creator_profiles WHERE user_id = ${userId}`;
    if (creators.length === 0) return { stored: false };
  }
  const purpose = magicLinkPurpose(input.kind);
  const token = generateSecretToken();
  const hashed = hmacToken(input.keyring, token);
  await sql`
    INSERT INTO auth_tokens (
      id, user_id, email_digest, digest_hex, key_version, purpose, expires_at, consumed_at, created_at
    ) VALUES (
      ${newId()}, ${userId}, ${digest}, ${hashed.digestHex}, ${hashed.keyVersion}, ${purpose},
      ${new Date(now.getTime() + input.ttlMs)}, null, ${now}
    )
  `;
  return { stored: true, token };
}

export async function peekMagicLink(input: {
  token: string;
  keyring: TokenKeyring;
  kind: SessionKind;
  now?: Date;
}): Promise<{ valid: boolean; expired: boolean; consumed: boolean }> {
  const token = input.token.trim();
  if (!token) return { valid: false, expired: false, consumed: false };
  const sql = getSql();
  const now = input.now ?? new Date();
  const purpose = magicLinkPurpose(input.kind);
  const digests = lookupTokenDigest(input.keyring, token).map((d) => d.digestHex);
  const rows = await sql`
    SELECT consumed_at, expires_at FROM auth_tokens
    WHERE digest_hex = ANY(${digests}) AND purpose = ${purpose}
  `;
  const row = rows[0] as { consumed_at: Date | null; expires_at: Date } | undefined;
  if (!row) return { valid: false, expired: false, consumed: false };
  if (row.consumed_at) return { valid: false, expired: false, consumed: true };
  if (new Date(String(row.expires_at)) <= now) {
    return { valid: false, expired: true, consumed: false };
  }
  return { valid: true, expired: false, consumed: false };
}

export async function consumeMagicLink(input: {
  token: string;
  keyring: TokenKeyring;
  kind: SessionKind;
  ttlMs: number;
  now?: Date;
}): Promise<{ sessionToken: string; userId: string; creatorId: string | null }> {
  const sql = getSql();
  const now = input.now ?? new Date();
  const purpose = magicLinkPurpose(input.kind);
  const digests = lookupTokenDigest(input.keyring, input.token.trim()).map((d) => d.digestHex);
  const updated = await sql`
    UPDATE auth_tokens
    SET consumed_at = ${now}
    WHERE digest_hex = ANY(${digests})
      AND purpose = ${purpose}
      AND consumed_at IS NULL
      AND expires_at > ${now}
    RETURNING *
  `;
  const row = updated[0] as Record<string, unknown> | undefined;
  if (!row) {
    const existing = await sql`
      SELECT consumed_at, expires_at, purpose FROM auth_tokens
      WHERE digest_hex = ANY(${digests})
    `;
    const found = existing[0] as
      | { consumed_at: Date | null; expires_at: Date; purpose: string }
      | undefined;
    if (!found || found.purpose !== purpose) {
      throw new AppError('UNAUTHENTICATED', 'This sign-in link is not valid');
    }
    if (found.consumed_at) {
      throw new AppError('UNAUTHENTICATED', 'This sign-in link was already used');
    }
    throw new AppError('UNAUTHENTICATED', 'This sign-in link has expired');
  }
  const userId = String(row.user_id);
  let creatorId: string | null = null;
  if (input.kind === 'OPS') {
    const staff = await sql`SELECT staff_role FROM users WHERE id = ${userId}`;
    if (!(staff[0] as { staff_role: string | null } | undefined)?.staff_role) {
      throw new AppError('FORBIDDEN', 'Staff role required');
    }
  } else {
    const creators = await sql`SELECT id FROM creator_profiles WHERE user_id = ${userId}`;
    creatorId = (creators[0] as { id: string } | undefined)?.id ?? null;
    if (!creatorId) throw new AppError('FORBIDDEN', 'No creator profile for this account');
  }
  const sessionToken = generateSecretToken();
  const sessionHash = hmacToken(input.keyring, sessionToken);
  await sql`
    INSERT INTO sessions (
      id, user_id, token_hash, kind, expires_at, created_at, rotated_at,
      auth_method, auth_strength, authenticated_at, last_used_at
    )
    VALUES (
      ${newId()}, ${userId}, ${sessionHash.digestHex}, ${input.kind},
      ${new Date(now.getTime() + input.ttlMs)}, ${now}, ${now},
      'EMAIL_LINK', 'EMAIL_LINK', ${now}, ${now}
    )
  `;
  return { sessionToken, userId, creatorId };
}

export async function lookupSession(
  rawToken: string | undefined | null,
  keyring: TokenKeyring,
  kind: SessionKind,
): Promise<SessionRow | null> {
  if (!rawToken) return null;
  const sql = getSql();
  const digests = lookupTokenDigest(keyring, rawToken).map((d) => d.digestHex);
  const now = new Date();
  const rows = await sql`
    SELECT
      s.id, s.user_id, s.kind, s.expires_at, s.auth_method, s.auth_strength,
      s.step_up_expires_at, s.revoked_at, c.id AS creator_id, u.staff_role,
      COALESCE(array_agg(g.role) FILTER (WHERE g.role IS NOT NULL), '{}') AS roles
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    LEFT JOIN creator_profiles c ON c.user_id = s.user_id
    LEFT JOIN staff_role_grants g ON g.user_id = s.user_id
    WHERE s.token_hash = ANY(${digests}) AND s.kind = ${kind}
    GROUP BY s.id, c.id, u.staff_role
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const expiresAt = new Date(String(row.expires_at));
  if (expiresAt <= now) return null;
  if (row.revoked_at) return null;
  const roles = (Array.isArray(row.roles) ? row.roles : []).filter(Boolean) as OpsRole[];
  if (kind === 'OPS' && !row.staff_role && roles.length === 0) return null;
  if (kind === 'CREATOR' && row.creator_id == null) return null;
  const authMethod = (String(row.auth_method ?? 'EMAIL_LINK') as AuthMethod) || 'EMAIL_LINK';
  const storedStrength =
    (String(row.auth_strength ?? 'EMAIL_LINK') as AuthStrength) || 'EMAIL_LINK';
  const stepUpExpiresAt = row.step_up_expires_at ? new Date(String(row.step_up_expires_at)) : null;
  await sql`UPDATE sessions SET last_used_at = ${now} WHERE id = ${String(row.id)}`;
  return {
    id: String(row.id),
    userId: String(row.user_id),
    creatorId: row.creator_id == null ? null : String(row.creator_id),
    kind: row.kind as SessionKind,
    expiresAt,
    opsRoles: roles,
    authMethod,
    authStrength: effectiveAuthStrength(authMethod, storedStrength, stepUpExpiresAt, now),
    stepUpExpiresAt,
    revokedAt: row.revoked_at ? new Date(String(row.revoked_at)) : null,
  };
}

export async function revokeUserSessions(userId: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`DELETE FROM sessions WHERE user_id = ${userId} RETURNING id`;
  return rows.length;
}

export async function listUserSessions(userId: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, kind, expires_at, created_at FROM sessions WHERE user_id = ${userId}
  `;
  return rows.map((raw) => {
    const row = raw as Record<string, unknown>;
    return {
      id: String(row.id),
      kind: String(row.kind),
      expiresAt: new Date(String(row.expires_at)),
      createdAt: new Date(String(row.created_at)),
    };
  });
}
