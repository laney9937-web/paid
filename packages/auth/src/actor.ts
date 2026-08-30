import type { ActorContext, AuthMethod, AuthStrength, OpsRole } from '@paid/contracts';

export type VerifiedSession = {
  id: string;
  userId: string;
  creatorId: string | null;
  kind: 'CREATOR' | 'OPS';
  opsRoles: readonly OpsRole[];
  authMethod: AuthMethod;
  authStrength: AuthStrength;
  stepUpExpiresAt: Date | null;
  revokedAt: Date | null;
};

export function actorFromSession(session: VerifiedSession, requestId: string): ActorContext {
  return {
    actorType: session.kind === 'OPS' ? 'OPS' : 'CREATOR',
    actorId: session.userId,
    creatorId: session.creatorId ?? undefined,
    sessionId: session.id,
    opsRoles: session.kind === 'OPS' ? session.opsRoles : undefined,
    authMethod: session.authMethod,
    authStrength: session.authStrength,
    requestId,
  };
}

export function effectiveAuthStrength(
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
