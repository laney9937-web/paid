import {
  AppError,
  generateSecretToken,
  hmacToken,
  lookupTokenDigest,
  type ActorContext,
  type TokenKeyring,
} from '@paid/contracts';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';
import type { GuestCredentialRecord } from '../records';

export async function peekGuestToken(
  uow: UnitOfWork,
  token: string,
): Promise<{ valid: boolean; expired: boolean; consumed: boolean; transactionId?: string }> {
  const cred = await findCredential(uow, token);
  if (!cred) return { valid: false, expired: false, consumed: false };
  const now = uow.clock.now();
  if (cred.revokedAt) return { valid: false, expired: false, consumed: true };
  if (cred.consumedAt)
    return { valid: false, expired: false, consumed: true, transactionId: cred.transactionId };
  if (cred.expiresAt <= now) return { valid: false, expired: true, consumed: false };
  return { valid: true, expired: false, consumed: false, transactionId: cred.transactionId };
}

export async function exchangeGuestToken(
  uow: UnitOfWork,
  input: { actor: ActorContext; token: string },
): Promise<{ transactionId: string; publicOrderCode: string; sessionToken: string }> {
  const cred = await findCredential(uow, tokenFrom(input.token));
  if (!cred) throw new AppError('UNAUTHENTICATED', 'This access link is not valid');
  const now = uow.clock.now();
  if (cred.revokedAt) throw new AppError('UNAUTHENTICATED', 'This access link was revoked');
  if (cred.consumedAt) {
    throw new AppError('UNAUTHENTICATED', 'This access link was already used');
  }
  if (cred.expiresAt <= now) throw new AppError('UNAUTHENTICATED', 'This access link has expired');
  if (cred.purpose !== 'ACCESS') {
    throw new AppError('UNAUTHENTICATED', 'This access link is not valid');
  }
  const updated: GuestCredentialRecord = { ...cred, consumedAt: now };
  await uow.updateGuestCredential(updated);
  const envelope = await uow.findSecretEnvelopeByCredential(cred.id);
  if (envelope && !envelope.consumedAt) {
    await uow.updateSecretEnvelope({
      ...envelope,
      ciphertext: null,
      authTag: null,
      consumedAt: now,
    });
  }
  const tx = await uow.getTransaction(cred.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  const sessionToken = generateSecretToken();
  const digest = hmacToken(uow.config.tokenKeyring, sessionToken);
  await uow.insertGuestCredential({
    id: newId(),
    transactionId: tx.id,
    digestHex: digest.digestHex,
    keyVersion: digest.keyVersion,
    purpose: 'SESSION',
    expiresAt: new Date(now.getTime() + 7 * 86400 * 1000),
    consumedAt: null,
    revokedAt: null,
    continuationIssuedAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: {
      ...input.actor,
      actorType: 'GUEST',
      guestTransactionId: tx.id,
      authStrength: 'EMAIL_LINK',
    },
    action: 'GUEST_TOKEN_EXCHANGED',
    subjectType: 'transaction',
    subjectId: tx.id,
    createdAt: now,
  });
  return { transactionId: tx.id, publicOrderCode: tx.publicOrderCode, sessionToken };
}

function tokenFrom(token: string): string {
  return token.trim();
}

async function findCredential(uow: UnitOfWork, token: string) {
  const digests = lookupTokenDigest(uow.config.tokenKeyring, token).map((d) => d.digestHex);
  return uow.findGuestCredentialByDigests(digests);
}

export async function revokeGuestToken(uow: UnitOfWork, token: string): Promise<void> {
  const cred = await findCredential(uow, tokenFrom(token));
  if (!cred) throw new AppError('NOT_FOUND', 'Token not found');
  await uow.updateGuestCredential({ ...cred, revokedAt: uow.clock.now() });
}

export async function resolveGuestSession(
  uow: UnitOfWork,
  sessionToken: string | undefined | null,
): Promise<{ transactionId: string } | null> {
  if (!sessionToken) return null;
  const cred = await findCredential(uow, tokenFrom(sessionToken));
  if (!cred || cred.purpose !== 'SESSION') return null;
  const now = uow.clock.now();
  if (cred.revokedAt || cred.consumedAt) return null;
  if (cred.expiresAt <= now) return null;
  return { transactionId: cred.transactionId };
}

export function digestToken(keyring: TokenKeyring, token: string) {
  return hmacToken(keyring, token);
}
