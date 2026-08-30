import { AppError, money, type ActorContext } from '@paid/contracts';
import { newId } from '../uuid';
import { requestHash } from '../hash';
import type { UnitOfWork } from '../ports';

const OPEN_REFUND_STATES = new Set(['REQUESTED', 'SUBMITTED', 'PROVIDER_PENDING', 'SUCCEEDED']);

export async function createRefund(
  uow: UnitOfWork,
  input: {
    actor: ActorContext;
    transactionId: string;
    amountMinor: string;
    idempotencyKey: string;
  },
): Promise<{ refundId: string; alreadyExisted: boolean; state: 'REQUESTED' }> {
  const allowed =
    input.actor.actorType === 'OPS' &&
    (input.actor.opsRoles?.includes('DISPUTES') || input.actor.opsRoles?.includes('PAYMENTS'));
  if (!allowed) throw new AppError('FORBIDDEN', 'Refunds require disputes or payments operators');
  if (input.actor.authStrength !== 'STEP_UP' && input.actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required for refunds');
  }
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  const payment = await uow.getPaymentByTransaction(tx.id);
  if (!payment || payment.state !== 'CAPTURED') {
    throw new AppError('STATE_CONFLICT', 'No captured payment to refund');
  }
  const amount = money(input.amountMinor, payment.amount.currency);
  if (amount.amountMinor <= 0n)
    throw new AppError('VALIDATION_FAILED', 'Refund amount must be positive');
  const existingRefunds = await uow.listRefunds(tx.id);
  const reserved = existingRefunds
    .filter((row) => OPEN_REFUND_STATES.has(row.state))
    .reduce((sum, row) => sum + row.amount.amountMinor, 0n);
  const remaining = payment.capturedAmount.amountMinor - reserved;
  if (amount.amountMinor > remaining) {
    throw new AppError('VALIDATION_FAILED', 'Refund exceeds refundable amount');
  }
  const scope = `refund:${tx.id}`;
  const keyHash = requestHash({ scope, key: input.idempotencyKey });
  const bodyHash = requestHash({
    transactionId: tx.id,
    amountMinor: amount.amountMinor.toString(),
  });
  const existing = await uow.findIdempotency(scope, keyHash);
  if (existing) {
    if (existing.requestHash !== bodyHash) {
      throw new AppError(
        'IDEMPOTENCY_CONFLICT',
        'Idempotency key was reused with a different request',
      );
    }
    return {
      refundId: JSON.parse(existing.resultJson).refundId as string,
      alreadyExisted: true,
      state: 'REQUESTED',
    };
  }
  const now = uow.clock.now();
  const refundId = newId();
  await uow.insertRefund({
    id: refundId,
    transactionId: tx.id,
    amount,
    state: 'REQUESTED',
    providerRefundId: null,
    createdAt: now,
    version: 1,
  });
  await uow.insertIdempotency({
    id: newId(),
    scope,
    keyHash,
    requestHash: bodyHash,
    resultJson: JSON.stringify({ refundId }),
    createdAt: now,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'REFUND_REQUESTED',
    subjectType: 'refund',
    subjectId: refundId,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'PROVIDER_CREATE_REFUND',
    payload: {
      refundId,
      transactionId: tx.id,
      amountMinor: amount.amountMinor.toString(),
    },
    dedupeKey: `provider-create-refund:${refundId}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 8,
    state: 'PENDING',
  });
  return { refundId, alreadyExisted: false, state: 'REQUESTED' };
}
