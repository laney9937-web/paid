import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import type { CanonicalProviderEvent, Clock, MoneyWire } from '@paid/contracts';
import type {
  CheckoutSession,
  PaymentProviderAdapter,
  ProviderCapabilities,
  ProviderPayment,
  VerifiedProviderEvent,
} from '@paid/payments-core';

export type MockScenario =
  | 'happy-path'
  | 'decline'
  | 'provider-timeout-unknown'
  | 'late-success-after-timeout'
  | 'duplicate-webhook'
  | 'out-of-order-events'
  | 'unknown-valid-event'
  | 'invalid-signature'
  | 'key-rotation-overlap'
  | 'partial-then-full-refund'
  | 'chargeback-after-payout'
  | 'payout-failure-and-retry'
  | 'identity-review-rejected'
  | 'email-bounce'
  | 'email-link-scanner-prefetch'
  | 'two-buyers-one-link-race';

export type MockPaymentsState = {
  scenario: MockScenario;
  clock: Clock;
  currentKey: string;
  previousKey?: string;
  payments: Map<string, ProviderPayment>;
  events: CanonicalProviderEvent[];
};

const SUPPORTED: ProviderCapabilities = {
  checkout: 'SUPPORTED',
  refund: 'SUPPORTED',
  partialRefund: 'SUPPORTED',
  payout: 'SUPPORTED',
  payoutHold: 'SUPPORTED',
  webhookSignatures: 'SUPPORTED',
  reconciliationExport: 'SUPPORTED',
  statementDescriptor: 'SUPPORTED',
  adultLane: 'UNSUPPORTED',
};

export function signMockBody(raw: string, key: string, keyVersion: string): string {
  return `${keyVersion}=${createHmac('sha256', key).update(raw).digest('hex')}`;
}

export function createMockPaymentsAdapter(state: MockPaymentsState): PaymentProviderAdapter {
  return {
    name: 'mock',
    adapterVersion: 'mock.v1',
    async getCapabilities() {
      return SUPPORTED;
    },
    async createCreatorOnboarding(input) {
      if (state.scenario === 'identity-review-rejected') {
        return { sessionId: `onb_${input.creatorId}`, status: 'REJECTED' };
      }
      return { sessionId: `onb_${input.creatorId}`, status: 'ACTIVE' };
    },
    async getCreatorComplianceStatus() {
      if (state.scenario === 'identity-review-rejected') return { status: 'REJECTED' };
      return { status: 'ACTIVE' };
    },
    async createCheckout(input) {
      if (state.scenario === 'decline') {
        return {
          providerCheckoutId: `chk_declined_${input.transactionId}`,
          redirectUrl: '/checkout/return/mock?state=declined',
          state: 'FAILED',
        };
      }
      if (state.scenario === 'provider-timeout-unknown') {
        return {
          providerCheckoutId: `chk_unknown_${input.transactionId}`,
          redirectUrl: '/checkout/return/mock?state=unknown',
          state: 'UNKNOWN',
        };
      }
      const session: CheckoutSession = {
        providerCheckoutId: `chk_${input.transactionId}`,
        redirectUrl: `/checkout/return/mock?checkout=chk_${input.transactionId}`,
        state: 'PENDING',
      };
      return session;
    },
    async getPayment(providerPaymentId) {
      return (
        state.payments.get(providerPaymentId) ?? {
          providerPaymentId,
          state: 'UNKNOWN',
          amount: { amountMinor: '0', currency: 'USD' },
        }
      );
    },
    async createRefund(input) {
      return {
        providerRefundId: `ref_${input.idempotencyKey}`,
        state: 'SUCCEEDED',
        amount: input.amount,
      };
    },
    async getRefund(providerRefundId) {
      return {
        providerRefundId,
        state: 'SUCCEEDED',
        amount: { amountMinor: '0', currency: 'USD' },
      };
    },
    async getNetworkDispute(providerDisputeId) {
      return {
        providerDisputeId,
        state: state.scenario === 'chargeback-after-payout' ? 'LOST' : 'OPEN',
      };
    },
    async getPayout(providerPayoutId) {
      if (state.scenario === 'payout-failure-and-retry') {
        return { providerPayoutId, state: 'FAILED' };
      }
      return { providerPayoutId, state: 'PAID' };
    },
    async verifyAndNormalizeWebhook(rawBody, headers) {
      const raw = new TextDecoder().decode(rawBody);
      const header = headers.get('x-mock-signature') ?? '';
      const timestamp = headers.get('x-mock-timestamp');
      if (timestamp) {
        const ts = Date.parse(timestamp);
        if (Math.abs(state.clock.now().getTime() - ts) > 5 * 60 * 1000) {
          throw new Error('stale webhook timestamp');
        }
      }
      const [version, sig] = header.split('=');
      const keys: Record<string, string> = { v1: state.currentKey };
      if (state.previousKey) keys.v0 = state.previousKey;
      const key = version ? keys[version] : undefined;
      const expected = key ? createHmac('sha256', key).update(raw).digest('hex') : '';
      const signatureValid = Boolean(
        key &&
          sig &&
          expected.length === sig.length &&
          timingSafeEqual(Buffer.from(expected), Buffer.from(sig)),
      );
      const payload = JSON.parse(raw) as {
        eventType: string;
        providerEventId: string;
        providerResourceId: string;
        occurredAt: string;
        amount?: MoneyWire;
        resourceType?: CanonicalProviderEvent['providerResourceType'];
      };
      const event: CanonicalProviderEvent = {
        canonicalEventId: createHash('sha256')
          .update(payload.providerEventId)
          .digest('hex')
          .slice(0, 32),
        provider: 'mock',
        providerConfigurationId: 'mock-provider-config',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: payload.eventType,
        providerEventId: payload.providerEventId,
        providerResourceType: payload.resourceType ?? 'PAYMENT',
        providerResourceId: payload.providerResourceId,
        occurredAt: payload.occurredAt,
        receivedAt: state.clock.now().toISOString(),
        amount: payload.amount,
        rawPayloadDigest: createHash('sha256').update(rawBody).digest('hex'),
        verificationKeyVersion: version ?? 'unknown',
        normalizedData: payload,
      };
      if (!signatureValid && state.scenario !== 'invalid-signature') {
        throw new Error('invalid signature');
      }
      return {
        event,
        signatureValid,
        keyVersion: version ?? 'unknown',
      } satisfies VerifiedProviderEvent;
    },
    async fetchReconciliation() {
      return { items: [...state.events] };
    },
  };
}

export const MOCK_SCENARIOS: MockScenario[] = [
  'happy-path',
  'decline',
  'provider-timeout-unknown',
  'late-success-after-timeout',
  'duplicate-webhook',
  'out-of-order-events',
  'unknown-valid-event',
  'invalid-signature',
  'key-rotation-overlap',
  'partial-then-full-refund',
  'chargeback-after-payout',
  'payout-failure-and-retry',
  'identity-review-rejected',
  'email-bounce',
  'email-link-scanner-prefetch',
  'two-buyers-one-link-race',
];
