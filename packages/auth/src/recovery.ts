import { AppError } from '@paid/contracts';

export const MAGIC_LINK_PUBLIC_ACK = 'If an account exists for that email, we sent a sign-in link.';

export function magicLinkPublicResponse(): { ok: true; message: string } {
  return { ok: true, message: MAGIC_LINK_PUBLIC_ACK };
}

export function passkeyRelyingParty(input: { rpID: string; origin: string }): {
  rpID: string;
  origin: string;
  userVerification: 'required';
} {
  if (!input.rpID || !input.origin) {
    throw new AppError('VALIDATION_FAILED', 'Passkey relying party is incomplete');
  }
  if (input.origin.includes('*')) {
    throw new AppError('VALIDATION_FAILED', 'Passkey origin cannot be a wildcard');
  }
  return { rpID: input.rpID, origin: input.origin, userVerification: 'required' };
}

export type SessionRecord = {
  id: string;
  userId: string;
  issuedAt: Date;
  revokedAt: Date | null;
  rotatedFrom?: string;
};

export function rotateSession(
  session: SessionRecord,
  now: Date,
  nextId: string,
): { previous: SessionRecord; next: SessionRecord } {
  return {
    previous: { ...session, revokedAt: now },
    next: {
      id: nextId,
      userId: session.userId,
      issuedAt: now,
      revokedAt: null,
      rotatedFrom: session.id,
    },
  };
}

export function revokeSessions(sessions: SessionRecord[], now: Date): SessionRecord[] {
  return sessions.map((session) => ({ ...session, revokedAt: session.revokedAt ?? now }));
}

export function assertChallenge(input: {
  consumedAt: Date | null;
  expiresAt: Date;
  now: Date;
}): void {
  if (input.consumedAt) {
    throw new AppError('UNAUTHENTICATED', 'Challenge was already used');
  }
  if (input.expiresAt <= input.now) {
    throw new AppError('UNAUTHENTICATED', 'Challenge has expired');
  }
}

export function recoveryBlocksPayoutChange(
  lastRecoveryAt: Date | null,
  now: Date,
  cooldownMs: number,
): boolean {
  if (!lastRecoveryAt) return false;
  return now.getTime() - lastRecoveryAt.getTime() < cooldownMs;
}
