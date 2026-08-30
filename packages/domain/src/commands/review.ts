import { AppError, type ActorContext } from '@paid/contracts';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

export async function submitReview(
  uow: UnitOfWork,
  input: { actor: ActorContext; transactionId: string; rating: number; body: string },
): Promise<void> {
  if (!uow.config.reviewEnabled) {
    throw new AppError('FORBIDDEN', 'Reviews are disabled');
  }
  if (input.actor.actorType !== 'GUEST' || input.actor.guestTransactionId !== input.transactionId) {
    throw new AppError('FORBIDDEN', 'Guest session does not match this transaction');
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new AppError('VALIDATION_FAILED', 'Rating must be an integer from 1 to 5');
  }
  const body = input.body.trim().slice(0, 2000);
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  if (tx.paymentState !== 'CAPTURED') {
    throw new AppError('STATE_CONFLICT', 'No eligible transaction for review');
  }
  if (
    tx.fulfillmentState !== 'BUYER_ACCEPTED' &&
    tx.fulfillmentState !== 'CREATOR_MARKED_DELIVERED'
  ) {
    throw new AppError('STATE_CONFLICT', 'Review is not eligible yet');
  }
  if (input.actor.creatorId && input.actor.creatorId === tx.creatorId) {
    throw new AppError('FORBIDDEN', 'A creator cannot review their own transaction');
  }
  const existing = await uow.getReviewByTransaction(tx.id);
  if (existing) {
    throw new AppError('STATE_CONFLICT', 'This transaction already has a review');
  }
  const payment = await uow.getPaymentByTransaction(tx.id);
  const dispute = await uow.getDisputeByTransaction(tx.id);
  const refunded = Boolean(payment && payment.refundedAmount.amountMinor > 0n);
  const includedInAggregate = !refunded && !dispute;
  const now = uow.clock.now();
  await uow.insertReview({
    id: newId(),
    transactionId: tx.id,
    creatorId: tx.creatorId,
    state: 'PENDING_MODERATION',
    rating: input.rating,
    body,
    includedInAggregate,
    createdAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'REVIEW_SUBMITTED',
    subjectType: 'review',
    subjectId: tx.id,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'TRUST_RECALCULATE',
    payload: { creatorId: tx.creatorId },
    dedupeKey: `trust-review:${tx.id}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 5,
    state: 'PENDING',
  });
}
