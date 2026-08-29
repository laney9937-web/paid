import { AppError, type ActorContext } from '@paid/contracts';
import { transitionFulfillment } from '../machines/fulfillment';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';
import type { TransactionRecord } from '../records';

export async function markDelivered(
  uow: UnitOfWork,
  input: { actor: ActorContext; transactionId: string; method: string; reference?: string },
): Promise<TransactionRecord> {
  if (input.actor.actorType !== 'CREATOR' || !input.actor.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx || tx.creatorId !== input.actor.creatorId) {
    throw new AppError('NOT_FOUND', 'Transaction not found');
  }
  if (tx.paymentState !== 'CAPTURED') {
    throw new AppError('STATE_CONFLICT', 'Cannot mark delivered before payment is captured');
  }
  if (
    tx.fulfillmentState === 'CREATOR_MARKED_DELIVERED' ||
    tx.fulfillmentState === 'BUYER_ACCEPTED'
  ) {
    return tx;
  }
  const next = transitionFulfillment(tx.fulfillmentState, 'MARK_DELIVERED');
  const now = uow.clock.now();
  const updated = { ...tx, fulfillmentState: next, version: tx.version + 1 };
  await uow.updateTransaction(updated);
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'MARK_DELIVERED',
    subjectType: 'transaction',
    subjectId: tx.id,
    reason: input.method,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'EMAIL_BUYER_DELIVERED',
    payload: { transactionId: tx.id, referencePresent: Boolean(input.reference) },
    dedupeKey: `email-delivered:${tx.id}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 8,
    state: 'PENDING',
  });
  return updated;
}

export async function confirmDelivery(
  uow: UnitOfWork,
  input: { actor: ActorContext; transactionId: string },
): Promise<TransactionRecord> {
  if (input.actor.actorType !== 'GUEST' || input.actor.guestTransactionId !== input.transactionId) {
    throw new AppError('FORBIDDEN', 'Guest session does not match this transaction');
  }
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  if (tx.fulfillmentState === 'BUYER_ACCEPTED') return tx;
  if (tx.fulfillmentState !== 'CREATOR_MARKED_DELIVERED') {
    throw new AppError('STATE_CONFLICT', 'Delivery has not been declared yet');
  }
  const next = transitionFulfillment(tx.fulfillmentState, 'BUYER_ACCEPT');
  const now = uow.clock.now();
  const updated = { ...tx, fulfillmentState: next, version: tx.version + 1 };
  await uow.updateTransaction(updated);
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'BUYER_CONFIRMED',
    subjectType: 'transaction',
    subjectId: tx.id,
    createdAt: now,
  });
  return updated;
}

export async function openInternalDispute(
  uow: UnitOfWork,
  input: { actor: ActorContext; transactionId: string; reasonCode: string },
): Promise<void> {
  if (input.actor.actorType !== 'GUEST' || input.actor.guestTransactionId !== input.transactionId) {
    throw new AppError('FORBIDDEN', 'Guest session does not match this transaction');
  }
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  if (tx.paymentState !== 'CAPTURED') {
    throw new AppError('STATE_CONFLICT', 'No captured payment to dispute');
  }
  const existing = await uow.getDisputeByTransaction(tx.id);
  if (existing) return;
  const now = uow.clock.now();
  if (tx.providerAuthoritativePaidAt) {
    const windowMs = uow.config.policy.reviewWindowDays * 86400 * 1000;
    if (now.getTime() - tx.providerAuthoritativePaidAt.getTime() > windowMs) {
      throw new AppError('STATE_CONFLICT', 'Dispute window has closed');
    }
  }
  const nextFulfillment = transitionFulfillment(
    tx.fulfillmentState === 'DISPUTED' ? 'AWAITING_DELIVERY' : tx.fulfillmentState,
    'DISPUTE',
  );
  await uow.updateTransaction({
    ...tx,
    fulfillmentState: nextFulfillment,
    version: tx.version + 1,
  });
  await uow.insertDispute({
    id: newId(),
    transactionId: tx.id,
    state: 'OPEN',
    openedBy: 'GUEST',
    reasonCode: input.reasonCode,
    createdAt: now,
    version: 1,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'DISPUTE_OPENED',
    subjectType: 'transaction',
    subjectId: tx.id,
    reason: input.reasonCode,
    createdAt: now,
  });
}
