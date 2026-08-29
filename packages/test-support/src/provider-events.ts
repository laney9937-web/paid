import type { CanonicalProviderEvent } from '@paid/contracts';
import { toWire, type Money } from '@paid/contracts';

export function capturedEvent(params: {
  transactionId: string;
  providerPaymentId: string;
  amount: Money;
  occurredAt: Date;
  providerEventId?: string;
}): CanonicalProviderEvent {
  return {
    canonicalEventId: `canon_${params.providerEventId ?? params.providerPaymentId}`,
    provider: 'mock',
    providerConfigurationId: 'mock-provider-config',
    adapterVersion: 'mock.v1',
    schemaVersion: 1,
    eventType: 'PAYMENT_CAPTURED',
    providerEventId: params.providerEventId ?? `evt_${params.providerPaymentId}`,
    providerResourceType: 'PAYMENT',
    providerResourceId: params.providerPaymentId,
    occurredAt: params.occurredAt.toISOString(),
    receivedAt: params.occurredAt.toISOString(),
    amount: toWire(params.amount),
    rawPayloadDigest: 'a'.repeat(64),
    verificationKeyVersion: 'v1',
    normalizedData: { transactionId: params.transactionId },
  };
}
