import { AppError, type ActorContext, type OpsRole } from '@paid/contracts';

export function assertCreatorOwns(actor: ActorContext, creatorId: string): void {
  if (actor.actorType !== 'CREATOR' || actor.creatorId !== creatorId) {
    throw new AppError('FORBIDDEN', 'Not allowed');
  }
}

export function assertGuestScope(actor: ActorContext, transactionId: string): void {
  if (actor.actorType !== 'GUEST' || actor.guestTransactionId !== transactionId) {
    throw new AppError('FORBIDDEN', 'Not allowed');
  }
}

export function assertOpsRole(actor: ActorContext, role: OpsRole): void {
  if (actor.actorType !== 'OPS' || !actor.opsRoles?.includes(role)) {
    throw new AppError('FORBIDDEN', 'Not allowed');
  }
}

export function assertFresh(actor: ActorContext): void {
  if (actor.authStrength !== 'STEP_UP' && actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required');
  }
}

export function denyOrderCodeAuth(): never {
  throw new AppError('UNAUTHENTICATED', 'Public order code is not an authentication credential');
}
