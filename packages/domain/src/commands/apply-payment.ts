import { AppError, type ActorContext, type CanonicalProviderEvent } from '@paid/contracts';
import { addDuration } from '../duration';
import { captureJournal } from '../ledger-postings';
import { transitionLink } from '../machines/link';
import { transitionPayment } from '../machines/payment';
import { transitionReservation } from '../machines/reservation';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

export async function attachProviderCheckout(
  uow: UnitOfWork,
  input: { reservationId: string; providerCheckoutId: string; redirectUrl: string },
): Promise<void> {
  const now = uow.clock.now();
  const reservation = await uow.getReservation(input.reservationId);
  if (!reservation) throw new AppError('NOT_FOUND', 'Reservation not found');
  const next = transitionReservation(reservation.state, 'PROVIDER_CREATED');
  await uow.updateReservation({
    ...reservation,
    state: next,
    providerCheckoutId: input.providerCheckoutId,
    lastTruthCheckAt: now,
    version: reservation.version + 1,
  });
  const tx = await uow.getTransaction(reservation.transactionId);
  if (!tx) return;
  const payment = await uow.getPaymentByTransaction(tx.id);
  if (payment && payment.state === 'CREATED') {
    await uow.updatePayment({
      ...payment,
      state: transitionPayment(payment.state, 'AUTH_START'),
      version: payment.version + 1,
    });
  }
}

/**
 * Payment truth comes from a verified provider event, never from a browser return.
 */
export async function capturePaymentFromProvider(
  uow: UnitOfWork,
  input: {
    actor: ActorContext;
    transactionId: string;
    providerPaymentId: string;
    providerAuthoritativePaidAt: Date;
    event: CanonicalProviderEvent;
  },
): Promise<void> {
  const tx = await uow.getTransaction(input.transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  const payment = await uow.getPaymentByTransaction(tx.id);
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found');
  if (payment.state === 'CAPTURED') {
    return;
  }
  const snapshot = await uow.getSnapshot(tx.snapshotId);
  if (!snapshot) throw new AppError('INTERNAL_ERROR', 'Missing purchase snapshot');
  const reservation = await uow.getReservationByTransaction(tx.id);
  const link = await uow.lockLink(tx.linkId);
  if (!link) throw new AppError('NOT_FOUND', 'Link not found');

  const now = uow.clock.now();
  const nextPayment = transitionPayment(payment.state, 'CAPTURE');
  const deadline = addDuration(input.providerAuthoritativePaidAt, snapshot.deliveryDuration);

  await uow.updatePayment({
    ...payment,
    state: nextPayment,
    providerPaymentId: input.providerPaymentId,
    capturedAmount: payment.amount,
    version: payment.version + 1,
  });
  await uow.updateTransaction({
    ...tx,
    paymentState: nextPayment,
    providerAuthoritativePaidAt: input.providerAuthoritativePaidAt,
    deliveryDeadlineAt: deadline,
    version: tx.version + 1,
  });
  if (reservation) {
    await uow.updateReservation({
      ...reservation,
      state: transitionReservation(reservation.state, 'CAPTURE'),
      lastTruthCheckAt: now,
      version: reservation.version + 1,
    });
  }
  if (link.state === 'ACTIVE' || link.state === 'DRAFT') {
    await uow.updateLink({
      ...link,
      state: transitionLink(
        link.state === 'DRAFT' ? transitionLink('DRAFT', 'ACTIVATE') : link.state,
        'USE',
      ),
      version: link.version + 1,
    });
  }
  const journal = captureJournal({
    transactionId: tx.id,
    snapshot,
    occurredAt: input.providerAuthoritativePaidAt,
  });
  await uow.appendJournal(journal);
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'PAYMENT_CAPTURED',
    subjectType: 'transaction',
    subjectId: tx.id,
    createdAt: now,
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'EMAIL_BUYER_RECEIPT',
    payload: { transactionId: tx.id },
    dedupeKey: `email-receipt:${tx.id}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 8,
    state: 'PENDING',
  });
  await uow.insertOutbox({
    id: newId(),
    type: 'TRUST_RECALCULATE',
    payload: { creatorId: tx.creatorId },
    dedupeKey: `trust:${tx.creatorId}:${tx.id}`,
    availableAt: now,
    attemptCount: 0,
    maxAttempts: 5,
    state: 'PENDING',
  });
}

export async function markCheckoutUnknown(uow: UnitOfWork, transactionId: string): Promise<void> {
  const tx = await uow.getTransaction(transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  const payment = await uow.getPaymentByTransaction(tx.id);
  const reservation = await uow.getReservationByTransaction(tx.id);
  if (!payment || !reservation) throw new AppError('NOT_FOUND', 'Payment/reservation missing');
  if (payment.state === 'CAPTURED') return;
  const now = uow.clock.now();
  await uow.updatePayment({
    ...payment,
    state: transitionPayment(payment.state, 'UNKNOWN'),
    version: payment.version + 1,
  });
  await uow.updateReservation({
    ...reservation,
    state: transitionReservation(reservation.state, 'HOLD'),
    lastTruthCheckAt: now,
    version: reservation.version + 1,
  });
  await uow.updateTransaction({
    ...tx,
    paymentState: 'UNKNOWN_REQUIRES_RECONCILIATION',
    version: tx.version + 1,
  });
}

export async function failCheckout(uow: UnitOfWork, transactionId: string): Promise<void> {
  const tx = await uow.getTransaction(transactionId);
  if (!tx) throw new AppError('NOT_FOUND', 'Transaction not found');
  const payment = await uow.getPaymentByTransaction(tx.id);
  const reservation = await uow.getReservationByTransaction(tx.id);
  if (!payment || !reservation) return;
  if (payment.state === 'CAPTURED') return;
  await uow.updatePayment({
    ...payment,
    state: transitionPayment(payment.state, 'FAIL'),
    version: payment.version + 1,
  });
  await uow.updateReservation({
    ...reservation,
    state: transitionReservation(reservation.state, 'FAIL'),
    version: reservation.version + 1,
  });
  await uow.updateTransaction({
    ...tx,
    paymentState: 'FAILED',
    version: tx.version + 1,
  });
}

export async function releaseExpiredReservation(
  uow: UnitOfWork,
  transactionId: string,
  providerProvesNoPayment: boolean,
): Promise<void> {
  if (!providerProvesNoPayment) {
    throw new AppError('PAYMENT_UNKNOWN', 'Reservation cannot be released without provider proof');
  }
  const tx = await uow.getTransaction(transactionId);
  if (!tx) return;
  const reservation = await uow.getReservationByTransaction(tx.id);
  const payment = await uow.getPaymentByTransaction(tx.id);
  if (!reservation || !payment) return;
  if (payment.state === 'CAPTURED') return;
  if (reservation.state === 'EXPIRED_RELEASED' || reservation.state === 'FAILED') return;
  await uow.updateReservation({
    ...reservation,
    state: transitionReservation(reservation.state, 'RELEASE_EXPIRED'),
    version: reservation.version + 1,
  });
}

export async function authorizePaymentFromProvider(
  uow: UnitOfWork,
  input: { transactionId: string },
): Promise<void> {
  const payment = await uow.getPaymentByTransaction(input.transactionId);
  const tx = await uow.getTransaction(input.transactionId);
  if (!payment || !tx) return;
  if (payment.state === 'CAPTURED' || payment.state === 'AUTHORIZED') return;
  const next = transitionPayment(payment.state, 'AUTHORIZE');
  await uow.updatePayment({ ...payment, state: next, version: payment.version + 1 });
  await uow.updateTransaction({ ...tx, paymentState: next, version: tx.version + 1 });
}

export async function applyProviderCheckoutOutcome(
  uow: UnitOfWork,
  transactionId: string,
  outcome: 'FAILED' | 'UNKNOWN',
): Promise<'FAILED' | 'UNKNOWN'> {
  if (outcome === 'FAILED') {
    await failCheckout(uow, transactionId);
    return 'FAILED';
  }
  await markCheckoutUnknown(uow, transactionId);
  return 'UNKNOWN';
}

export function providerOutageError(): AppError {
  return new AppError('PROVIDER_UNAVAILABLE', 'Provider did not confirm checkout', {
    retryable: true,
  });
}

export async function applyLateCaptureAfterTimeout(
  uow: UnitOfWork,
  input: Parameters<typeof capturePaymentFromProvider>[1],
): Promise<void> {
  await capturePaymentFromProvider(uow, input);
}
