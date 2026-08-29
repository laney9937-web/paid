import { z } from 'zod';

export const ACTOR_TYPES = ['PUBLIC', 'GUEST', 'CREATOR', 'OPS', 'WORKER', 'PROVIDER'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const AUTH_STRENGTHS = ['NONE', 'EMAIL_LINK', 'PASSKEY', 'STEP_UP', 'SERVICE'] as const;
export type AuthStrength = (typeof AUTH_STRENGTHS)[number];

export const OPS_ROLES = [
  'SUPPORT',
  'DISPUTES',
  'RISK',
  'COMPLIANCE',
  'PAYMENTS',
  'SECURITY',
] as const;
export type OpsRole = (typeof OPS_ROLES)[number];

export type ActorContext = Readonly<{
  actorType: ActorType;
  actorId?: string;
  creatorId?: string;
  guestTransactionId?: string;
  sessionId?: string;
  opsRoles?: readonly OpsRole[];
  authStrength: AuthStrength;
  requestId: string;
  ipHash?: string;
  userAgentHash?: string;
}>;

export const actorContextSchema = z.object({
  actorType: z.enum(ACTOR_TYPES),
  actorId: z.string().optional(),
  creatorId: z.string().optional(),
  guestTransactionId: z.string().optional(),
  sessionId: z.string().optional(),
  opsRoles: z.array(z.enum(OPS_ROLES)).optional(),
  authStrength: z.enum(AUTH_STRENGTHS),
  requestId: z.string().min(8),
  ipHash: z.string().optional(),
  userAgentHash: z.string().optional(),
});

export function publicActor(requestId: string): ActorContext {
  return { actorType: 'PUBLIC', authStrength: 'NONE', requestId };
}

export function workerActor(requestId: string): ActorContext {
  return { actorType: 'WORKER', authStrength: 'SERVICE', requestId, actorId: 'worker' };
}

export function providerActor(requestId: string, provider: string): ActorContext {
  return { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId, actorId: provider };
}
