import { openSecret } from '@paid/domain';
import { loadConfig } from '@paid/config';
import { getSql } from './client';

function asBuffer(value: unknown): Buffer {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  return Buffer.from(value as ArrayBuffer);
}

export async function readContinueUrlFromOutbox(template: string): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    SELECT payload FROM outbox_jobs
    WHERE type = 'EMAIL_MAGIC_LINK'
    ORDER BY created_at DESC
    LIMIT 24
  `;
  const keyring = {
    currentVersion: loadConfig().RESTRICTED_FIELD_CURRENT_VERSION,
    keys: {
      v1: loadConfig().RESTRICTED_FIELD_KEY,
      ...(loadConfig().RESTRICTED_FIELD_PREVIOUS_KEY
        ? { v0: loadConfig().RESTRICTED_FIELD_PREVIOUS_KEY }
        : {}),
    },
  };
  for (const raw of rows) {
    const payload = raw as {
      payload: { template?: string; envelopeId?: string; continueUrl?: string };
    };
    if (payload.payload?.template !== template) continue;
    if (payload.payload.continueUrl) {
      throw new Error('plaintext continueUrl must not be stored in outbox');
    }
    if (!payload.payload.envelopeId) continue;
    const envelopes = await sql`
      SELECT ciphertext, nonce, auth_tag, key_version, consumed_at
      FROM secret_envelopes WHERE id = ${payload.payload.envelopeId}
    `;
    const env = envelopes[0] as Record<string, unknown> | undefined;
    if (!env || env.consumed_at || !env.ciphertext || !env.auth_tag) continue;
    return openSecret(
      {
        ciphertext: asBuffer(env.ciphertext),
        nonce: asBuffer(env.nonce),
        authTag: asBuffer(env.auth_tag),
        keyVersion: String(env.key_version),
      },
      keyring,
    );
  }
  throw new Error(`missing ${template} continueUrl envelope`);
}
