import { AppError, type ActorContext } from '@paid/contracts';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';
import type { TransactionRecord } from '../records';

const NOT_FOUND_MESSAGE = 'Transaction not found';

export async function changeCreatorHandle(
  uow: UnitOfWork,
  input: { actor: ActorContext; handle: string },
): Promise<{ creatorId: string; handle: string }> {
  if (input.actor.actorType !== 'CREATOR' || !input.actor.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  const handle = input.handle.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    throw new AppError('VALIDATION_FAILED', 'Handle is not valid');
  }
  const creator = await uow.getCreator(input.actor.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  const taken = await uow.getCreatorByHandle(handle);
  if (taken && taken.id !== creator.id) {
    throw new AppError('VALIDATION_FAILED', 'Handle is not available');
  }
  await uow.updateCreator({ ...creator, handle, version: creator.version + 1 });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'HANDLE_CHANGED',
    subjectType: 'creator',
    subjectId: creator.id,
    beforeDigest: creator.handle,
    afterDigest: handle,
    createdAt: uow.clock.now(),
  });
  return { creatorId: creator.id, handle };
}

export async function changePayoutDestination(
  uow: UnitOfWork,
  input: { actor: ActorContext; destinationFingerprint: string },
): Promise<void> {
  if (input.actor.actorType !== 'CREATOR' || !input.actor.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  if (input.actor.authStrength !== 'STEP_UP' && input.actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required to change payout');
  }
  if (!uow.config.payoutEnabled) {
    throw new AppError('FORBIDDEN', 'Payouts are disabled');
  }
  const creator = await uow.getCreator(input.actor.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  const now = uow.clock.now();
  await uow.updateCreator({ ...creator, payoutHold: true, version: creator.version + 1 });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'PAYOUT_DESTINATION_CHANGED',
    subjectType: 'creator',
    subjectId: creator.id,
    afterDigest: input.destinationFingerprint,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'EMAIL_SECURITY_ALERT',
    payload: { creatorId: creator.id, kind: 'PAYOUT_DESTINATION_CHANGED' },
    dedupeKey: `payout-dest:${creator.id}:${now.toISOString()}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 8,
    state: 'PENDING',
  });
}

export async function applyAccountRecovery(
  uow: UnitOfWork,
  input: { actor: ActorContext; creatorId: string },
): Promise<void> {
  const creator = await uow.getCreator(input.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  const now = uow.clock.now();
  await uow.updateCreator({ ...creator, payoutHold: true, version: creator.version + 1 });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'ACCOUNT_RECOVERY',
    subjectType: 'creator',
    subjectId: creator.id,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'SESSION_REVOKE_ALL',
    payload: { creatorId: creator.id },
    dedupeKey: `session-revoke:${creator.id}:${now.toISOString()}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 5,
    state: 'PENDING',
  });
}

export async function getVisibleTransaction(
  uow: UnitOfWork,
  input: { actor: ActorContext; transactionId?: string; publicOrderCode?: string },
): Promise<TransactionRecord> {
  const tx = input.transactionId
    ? await uow.getTransaction(input.transactionId)
    : input.publicOrderCode
      ? await uow.getTransactionByOrderCode(input.publicOrderCode)
      : null;
  if (!tx) throw new AppError('NOT_FOUND', NOT_FOUND_MESSAGE);
  if (input.actor.actorType === 'CREATOR' && input.actor.creatorId !== tx.creatorId) {
    throw new AppError('NOT_FOUND', NOT_FOUND_MESSAGE);
  }
  if (
    input.actor.actorType === 'GUEST' &&
    input.actor.guestTransactionId !== tx.id &&
    input.transactionId
  ) {
    throw new AppError('NOT_FOUND', NOT_FOUND_MESSAGE);
  }
  if (input.actor.actorType === 'PUBLIC' && input.transactionId) {
    throw new AppError('NOT_FOUND', NOT_FOUND_MESSAGE);
  }
  return tx;
}

export async function recordSensitiveRead(
  uow: UnitOfWork,
  input: { actor: ActorContext; subjectType: string; subjectId: string; action: string },
): Promise<void> {
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: input.action,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    createdAt: uow.clock.now(),
  });
}
