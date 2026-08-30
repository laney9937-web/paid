import {
  AppError,
  fromWire,
  type ActorContext,
  type CanonicalProviderEvent,
} from '@paid/contracts';
import {
  authorizePaymentFromProvider,
  capturePaymentFromProvider,
  failCheckout,
} from './apply-payment';
import { chargebackAfterPayoutJournal, payoutJournal } from '../ledger-postings';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

export type InboxRecord = {
  providerEventId: string;
  provider: string;
  signatureValid: boolean;
  processed: boolean;
  canonicalEventId?: string;
};

export interface InboxStore {
  findByProviderEventId(provider: string, providerEventId: string): Promise<InboxRecord | null>;
  insert(
    record: InboxRecord & { rawDigest: string; event: CanonicalProviderEvent },
  ): Promise<'inserted' | 'duplicate'>;
}

const KNOWN = new Set([
  'PAYMENT_CAPTURED',
  'PAYMENT_AUTHORIZED',
  'PAYMENT_FAILED',
  'CHECKOUT_CREATED',
  'REFUND_SUCCEEDED',
  'DISPUTE_OPENED',
  'DISPUTE_LOST',
  'PAYOUT_PAID',
  'PAYOUT_FAILED',
]);

export async function processCanonicalProviderEvent(
  uow: UnitOfWork,
  inbox: InboxStore,
  input: {
    actor: ActorContext;
    event: CanonicalProviderEvent;
    signatureValid: boolean;
    transactionId?: string;
  },
): Promise<{ duplicate: boolean; applied: boolean; unknown: boolean }> {
  if (!input.signatureValid) {
    throw new AppError('UNAUTHENTICATED', 'Invalid provider signature');
  }
  const existing = await inbox.findByProviderEventId(
    input.event.provider,
    input.event.providerEventId,
  );
  if (existing?.processed) {
    return { duplicate: true, applied: false, unknown: false };
  }
  const insert = await inbox.insert({
    providerEventId: input.event.providerEventId,
    provider: input.event.provider,
    signatureValid: true,
    processed: true,
    canonicalEventId: input.event.canonicalEventId,
    rawDigest: input.event.rawPayloadDigest,
    event: input.event,
  });
  if (insert === 'duplicate') {
    return { duplicate: true, applied: false, unknown: false };
  }

  if (!KNOWN.has(input.event.eventType) || input.event.eventType === 'UNKNOWN_VALID') {
    await uow.insertOutbox({
      id: newId(),
      type: 'ALERT_UNKNOWN_PROVIDER_EVENT',
      payload: { canonicalEventId: input.event.canonicalEventId, eventType: input.event.eventType },
      dedupeKey: `unknown-event:${input.event.canonicalEventId}`,
      availableAt: uow.clock.now(),
      attemptCount: 0,
      maxAttempts: 3,
      state: 'PENDING',
    });
    return { duplicate: false, applied: false, unknown: true };
  }

  if (input.event.eventType === 'PAYMENT_AUTHORIZED' && input.transactionId) {
    await authorizePaymentFromProvider(uow, { transactionId: input.transactionId });
    return { duplicate: false, applied: true, unknown: false };
  }
  if (input.event.eventType === 'PAYMENT_CAPTURED' && input.transactionId) {
    await capturePaymentFromProvider(uow, {
      actor: input.actor,
      transactionId: input.transactionId,
      providerPaymentId: input.event.providerResourceId,
      providerAuthoritativePaidAt: new Date(input.event.occurredAt),
      event: input.event,
    });
    return { duplicate: false, applied: true, unknown: false };
  }
  if (input.event.eventType === 'PAYMENT_FAILED' && input.transactionId) {
    await failCheckout(uow, input.transactionId);
    return { duplicate: false, applied: true, unknown: false };
  }
  if (input.event.eventType === 'DISPUTE_LOST' && input.transactionId && input.event.amount) {
    const tx = await uow.getTransaction(input.transactionId);
    if (tx) {
      await uow.appendJournal(
        chargebackAfterPayoutJournal({
          transactionId: tx.id,
          creatorId: tx.creatorId,
          amount: fromWire(input.event.amount),
          occurredAt: new Date(input.event.occurredAt),
        }),
      );
    }
    return { duplicate: false, applied: true, unknown: false };
  }
  if (input.event.eventType === 'PAYOUT_PAID' && input.event.amount) {
    const creatorId =
      (input.event.normalizedData as { creatorId?: string } | undefined)?.creatorId ??
      (input.transactionId
        ? (await uow.getTransaction(input.transactionId))?.creatorId
        : undefined);
    if (creatorId) {
      await uow.appendJournal(
        payoutJournal({
          payoutId: input.event.providerResourceId,
          creatorId,
          amount: fromWire(input.event.amount),
          occurredAt: new Date(input.event.occurredAt),
        }),
      );
    }
    return { duplicate: false, applied: true, unknown: false };
  }
  if (input.event.eventType === 'PAYOUT_FAILED') {
    await uow.insertAudit({
      id: newId(),
      actor: input.actor,
      action: 'PAYOUT_FAILED',
      subjectType: 'payout',
      subjectId: input.event.providerResourceId,
      createdAt: uow.clock.now(),
    });
    return { duplicate: false, applied: true, unknown: false };
  }
  return { duplicate: false, applied: true, unknown: false };
}
