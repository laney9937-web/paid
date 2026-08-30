import {
  AppError,
  fromWire,
  isKnownEventType,
  type ActorContext,
  type CanonicalProviderEvent,
  type KnownEventType,
  type ProviderEventOutcome,
} from '@paid/contracts';
import {
  attachProviderCheckout,
  authorizePaymentFromProvider,
  capturePaymentFromProvider,
  failCheckout,
} from './apply-payment';
import {
  chargebackAfterPayoutJournal,
  payoutFailedJournal,
  payoutJournal,
  refundJournal,
} from '../ledger-postings';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

export type InboxRecord = {
  providerEventId: string;
  provider: string;
  signatureValid: boolean;
  processed: boolean;
  canonicalEventId?: string;
  outcome?: ProviderEventOutcome | string | null;
};

export interface InboxStore {
  findByProviderEventId(provider: string, providerEventId: string): Promise<InboxRecord | null>;
  insert(
    record: InboxRecord & { rawDigest: string; event: CanonicalProviderEvent },
  ): Promise<'inserted' | 'duplicate'>;
  markOutcome(
    provider: string,
    providerEventId: string,
    outcome: ProviderEventOutcome,
  ): Promise<void>;
}

export type ProviderEventResult = {
  duplicate: boolean;
  applied: boolean;
  unknown: boolean;
  outcome: ProviderEventOutcome;
};

function result(outcome: ProviderEventOutcome): ProviderEventResult {
  return {
    duplicate: outcome === 'DUPLICATE',
    applied: outcome === 'APPLIED',
    unknown: outcome === 'UNKNOWN_ALERTED',
    outcome,
  };
}

function assertNever(value: never): never {
  throw new AppError('INTERNAL_ERROR', `Unhandled provider event ${String(value)}`);
}

export async function processCanonicalProviderEvent(
  uow: UnitOfWork,
  inbox: InboxStore,
  input: {
    actor: ActorContext;
    event: CanonicalProviderEvent;
    signatureValid: boolean;
    transactionId?: string;
  },
): Promise<ProviderEventResult> {
  if (!input.signatureValid) {
    throw new AppError('UNAUTHENTICATED', 'Invalid provider signature');
  }
  const existing = await inbox.findByProviderEventId(
    input.event.provider,
    input.event.providerEventId,
  );
  if (existing?.processed) {
    return result('DUPLICATE');
  }
  const insert = await inbox.insert({
    providerEventId: input.event.providerEventId,
    provider: input.event.provider,
    signatureValid: true,
    processed: false,
    canonicalEventId: input.event.canonicalEventId,
    rawDigest: input.event.rawPayloadDigest,
    event: input.event,
  });
  if (insert === 'duplicate') {
    const raced = await inbox.findByProviderEventId(
      input.event.provider,
      input.event.providerEventId,
    );
    if (raced?.processed) return result('DUPLICATE');
  }

  const outcome = await dispatchKnownEvent(uow, input);
  await inbox.markOutcome(input.event.provider, input.event.providerEventId, outcome);
  return result(outcome);
}

async function dispatchKnownEvent(
  uow: UnitOfWork,
  input: {
    actor: ActorContext;
    event: CanonicalProviderEvent;
    transactionId?: string;
  },
): Promise<ProviderEventOutcome> {
  if (!isKnownEventType(input.event.eventType)) {
    await alertUnknown(uow, input.event);
    return 'UNKNOWN_ALERTED';
  }
  const type: KnownEventType = input.event.eventType;
  switch (type) {
    case 'CHECKOUT_CREATED':
      return applyCheckoutCreated(uow, input);
    case 'PAYMENT_AUTHORIZED':
      return applyAuthorized(uow, input);
    case 'PAYMENT_CAPTURED':
      return applyCaptured(uow, input);
    case 'PAYMENT_FAILED':
      return applyFailed(uow, input);
    case 'PAYMENT_PAID_TIME_CORRECTED':
      return applyPaidTimeCorrected(uow, input);
    case 'REFUND_SUCCEEDED':
      return applyRefundSucceeded(uow, input);
    case 'REFUND_FAILED':
      return applyRefundFailed(uow, input);
    case 'DISPUTE_OPENED':
      return applyDisputeOpened(uow, input);
    case 'DISPUTE_WON':
      return applyDisputeWon(uow, input);
    case 'DISPUTE_LOST':
      return applyDisputeLost(uow, input);
    case 'PAYOUT_PAID':
      return applyPayoutPaid(uow, input);
    case 'PAYOUT_FAILED':
      return applyPayoutFailed(uow, input);
    case 'PAYOUT_REVERSED':
      return applyPayoutReversed(uow, input);
    case 'UNKNOWN_VALID':
      await alertUnknown(uow, input.event);
      return 'UNKNOWN_ALERTED';
    default:
      return assertNever(type);
  }
}

async function alertUnknown(uow: UnitOfWork, event: CanonicalProviderEvent): Promise<void> {
  await uow.insertOutbox({
    id: newId(),
    type: 'ALERT_UNKNOWN_PROVIDER_EVENT',
    payload: { canonicalEventId: event.canonicalEventId, eventType: event.eventType },
    dedupeKey: `unknown-event:${event.canonicalEventId}`,
    availableAt: uow.clock.now(),
    attemptCount: 0,
    maxAttempts: 3,
    state: 'PENDING',
  });
}

function txId(input: {
  event: CanonicalProviderEvent;
  transactionId?: string;
}): string | undefined {
  const fromData = (input.event.normalizedData as { transactionId?: string } | undefined)
    ?.transactionId;
  return input.transactionId ?? fromData;
}

async function applyCheckoutCreated(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  const reservation = await uow.getReservationByTransaction(transactionId);
  if (!reservation) return 'STORED_PENDING_DEPENDENCY';
  if (reservation.state !== 'RESERVED') return 'APPLIED';
  await attachProviderCheckout(uow, {
    reservationId: reservation.id,
    providerCheckoutId: input.event.providerResourceId,
    redirectUrl: `/checkout/return/mock?checkout=${reservation.id}`,
  });
  return 'APPLIED';
}

async function applyAuthorized(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  await authorizePaymentFromProvider(uow, { transactionId });
  return 'APPLIED';
}

async function applyCaptured(
  uow: UnitOfWork,
  input: { actor: ActorContext; event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  if (await uow.hasLedgerSource('PAYMENT_CAPTURED', transactionId)) return 'DUPLICATE';
  await capturePaymentFromProvider(uow, {
    actor: input.actor,
    transactionId,
    providerPaymentId: input.event.providerResourceId,
    providerAuthoritativePaidAt: new Date(input.event.occurredAt),
    event: input.event,
  });
  return 'APPLIED';
}

async function applyFailed(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  await failCheckout(uow, transactionId);
  return 'APPLIED';
}

async function applyPaidTimeCorrected(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  const tx = await uow.getTransaction(transactionId);
  if (!tx) return 'STORED_PENDING_DEPENDENCY';
  await uow.updateTransaction({
    ...tx,
    providerAuthoritativePaidAt: new Date(input.event.occurredAt),
    version: tx.version + 1,
  });
  return 'APPLIED';
}

async function applyRefundSucceeded(
  uow: UnitOfWork,
  input: { actor: ActorContext; event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const data = input.event.normalizedData as { refundId?: string } | undefined;
  const refund = data?.refundId
    ? await uow.getRefund(data.refundId)
    : input.transactionId
      ? (await uow.listRefunds(input.transactionId)).find((row) => row.state !== 'SUCCEEDED')
      : null;
  if (!refund) return 'STORED_PENDING_DEPENDENCY';
  if (refund.state === 'SUCCEEDED') return 'DUPLICATE';
  if (await uow.hasLedgerSource('REFUND_SUCCEEDED', refund.id)) return 'DUPLICATE';
  const tx = await uow.getTransaction(refund.transactionId);
  const snapshot = tx ? await uow.getSnapshot(tx.snapshotId) : null;
  const payment = tx ? await uow.getPaymentByTransaction(tx.id) : null;
  if (!tx || !snapshot || !payment) return 'STORED_PENDING_DEPENDENCY';
  await uow.appendJournal(
    refundJournal({
      transactionId: tx.id,
      refundId: refund.id,
      snapshot,
      refundAmount: refund.amount,
      occurredAt: new Date(input.event.occurredAt),
    }),
  );
  await uow.updateRefund({
    ...refund,
    state: 'SUCCEEDED',
    providerRefundId: input.event.providerResourceId,
    version: refund.version + 1,
  });
  await uow.updatePayment({
    ...payment,
    refundedAmount: {
      amountMinor: payment.refundedAmount.amountMinor + refund.amount.amountMinor,
      currency: payment.amount.currency,
    },
    version: payment.version + 1,
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'REFUND_SUCCEEDED',
    subjectType: 'refund',
    subjectId: refund.id,
    createdAt: uow.clock.now(),
  });
  return 'APPLIED';
}

async function applyRefundFailed(
  uow: UnitOfWork,
  input: { actor: ActorContext; event: CanonicalProviderEvent },
): Promise<ProviderEventOutcome> {
  const data = input.event.normalizedData as { refundId?: string } | undefined;
  if (!data?.refundId) return 'STORED_PENDING_DEPENDENCY';
  const refund = await uow.getRefund(data.refundId);
  if (!refund) return 'STORED_PENDING_DEPENDENCY';
  if (refund.state === 'FAILED') return 'DUPLICATE';
  await uow.updateRefund({ ...refund, state: 'FAILED', version: refund.version + 1 });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'REFUND_FAILED',
    subjectType: 'refund',
    subjectId: refund.id,
    createdAt: uow.clock.now(),
  });
  return 'APPLIED';
}

async function applyDisputeOpened(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  const existing = await uow.getDisputeByTransaction(transactionId);
  if (existing) return 'DUPLICATE';
  await uow.insertDispute({
    id: newId(),
    transactionId,
    state: 'OPEN',
    openedBy: 'OPS',
    reasonCode: 'PROVIDER_DISPUTE',
    createdAt: uow.clock.now(),
    version: 1,
  });
  return 'APPLIED';
}

async function applyDisputeWon(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId) return 'STORED_PENDING_DEPENDENCY';
  const dispute = await uow.getDisputeByTransaction(transactionId);
  if (!dispute) return 'STORED_PENDING_DEPENDENCY';
  await uow.updateDispute({
    ...dispute,
    state: 'CREATOR_WON',
    version: dispute.version + 1,
  });
  return 'APPLIED';
}

async function applyDisputeLost(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const transactionId = txId(input);
  if (!transactionId || !input.event.amount) return 'RECONCILIATION_REQUIRED';
  const tx = await uow.getTransaction(transactionId);
  if (!tx) return 'STORED_PENDING_DEPENDENCY';
  if (await uow.hasLedgerSource('CHARGEBACK_AFTER_PAYOUT', tx.id)) return 'DUPLICATE';
  await uow.appendJournal(
    chargebackAfterPayoutJournal({
      transactionId: tx.id,
      creatorId: tx.creatorId,
      amount: fromWire(input.event.amount),
      occurredAt: new Date(input.event.occurredAt),
    }),
  );
  return 'APPLIED';
}

async function applyPayoutPaid(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent; transactionId?: string },
): Promise<ProviderEventOutcome> {
  const data = input.event.normalizedData as { payoutId?: string; creatorId?: string } | undefined;
  const payoutId = data?.payoutId ?? input.event.providerResourceId;
  const payout = await uow.getPayout(payoutId);
  if (!payout) return 'STORED_PENDING_DEPENDENCY';
  if (payout.state === 'PAID' || (await uow.hasLedgerSource('PAYOUT_PAID', payout.id))) {
    return 'DUPLICATE';
  }
  if (!input.event.amount) return 'RECONCILIATION_REQUIRED';
  await uow.appendJournal(
    payoutJournal({
      payoutId: payout.id,
      creatorId: payout.creatorId,
      amount: fromWire(input.event.amount),
      occurredAt: new Date(input.event.occurredAt),
    }),
  );
  await uow.updatePayout({
    ...payout,
    state: 'PAID',
    providerPayoutId: input.event.providerResourceId,
    version: payout.version + 1,
    updatedAt: uow.clock.now(),
  });
  return 'APPLIED';
}

async function applyPayoutFailed(
  uow: UnitOfWork,
  input: { actor: ActorContext; event: CanonicalProviderEvent },
): Promise<ProviderEventOutcome> {
  const data = input.event.normalizedData as { payoutId?: string; creatorId?: string } | undefined;
  const payoutId = data?.payoutId ?? input.event.providerResourceId;
  const payout = await uow.getPayout(payoutId);
  if (!payout) {
    await uow.insertAudit({
      id: newId(),
      actor: input.actor,
      action: 'PAYOUT_FAILED',
      subjectType: 'payout',
      subjectId: payoutId,
      createdAt: uow.clock.now(),
    });
    return 'STORED_PENDING_DEPENDENCY';
  }
  if (payout.state === 'FAILED') return 'DUPLICATE';
  if (
    payout.state === 'SUBMITTED' ||
    payout.state === 'IN_TRANSIT' ||
    payout.state === 'REQUESTED'
  ) {
    if (!(await uow.hasLedgerSource('PAYOUT_FAILED', payout.id))) {
      await uow.appendJournal(
        payoutFailedJournal({
          payoutId: payout.id,
          creatorId: payout.creatorId,
          amount: payout.amount,
          occurredAt: new Date(input.event.occurredAt),
        }),
      );
    }
  }
  await uow.updatePayout({
    ...payout,
    state: 'FAILED',
    version: payout.version + 1,
    updatedAt: uow.clock.now(),
  });
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'PAYOUT_FAILED',
    subjectType: 'payout',
    subjectId: payout.id,
    createdAt: uow.clock.now(),
  });
  return 'APPLIED';
}

async function applyPayoutReversed(
  uow: UnitOfWork,
  input: { event: CanonicalProviderEvent },
): Promise<ProviderEventOutcome> {
  const data = input.event.normalizedData as { payoutId?: string } | undefined;
  const payout = await uow.getPayout(data?.payoutId ?? input.event.providerResourceId);
  if (!payout) return 'STORED_PENDING_DEPENDENCY';
  await uow.updatePayout({
    ...payout,
    state: 'REVERSED',
    version: payout.version + 1,
    updatedAt: uow.clock.now(),
  });
  return 'APPLIED';
}
