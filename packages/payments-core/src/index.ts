import type { CanonicalProviderEvent, MoneyWire } from '@paid/contracts';

export type ProviderCapabilityContext = {
  lane: 'ORDINARY' | 'ADULT';
  jurisdiction: string;
  buildMode: string;
};

export type ProviderCapabilities = {
  checkout: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  refund: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  partialRefund: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  payout: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  payoutHold: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  webhookSignatures: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  reconciliationExport: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  statementDescriptor: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
  adultLane: 'SUPPORTED' | 'UNSUPPORTED' | 'UNKNOWN';
};

export type CheckoutSession = {
  providerCheckoutId: string;
  redirectUrl: string;
  state: 'PENDING' | 'FAILED' | 'UNKNOWN';
};

export type ProviderPayment = {
  providerPaymentId: string;
  state: 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'UNKNOWN';
  amount: MoneyWire;
  paidAt?: string;
};

export type ProviderRefund = {
  providerRefundId: string;
  state: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  amount: MoneyWire;
};

export type ProviderDispute = {
  providerDisputeId: string;
  state: 'OPEN' | 'WON' | 'LOST';
};

export type ProviderPayout = {
  providerPayoutId: string;
  state: 'IN_TRANSIT' | 'PAID' | 'FAILED' | 'REVERSED';
};

export type VerifiedProviderEvent = {
  event: CanonicalProviderEvent;
  signatureValid: boolean;
  keyVersion: string;
};

export interface PaymentProviderAdapter {
  readonly name: string;
  readonly adapterVersion: string;
  getCapabilities(input: ProviderCapabilityContext): Promise<ProviderCapabilities>;
  createCreatorOnboarding(input: {
    creatorId: string;
  }): Promise<{ sessionId: string; status: string }>;
  getCreatorComplianceStatus(providerCreatorId: string): Promise<{ status: string }>;
  createCheckout(input: {
    transactionId: string;
    amount: MoneyWire;
    descriptor: string;
    idempotencyKey: string;
    returnUrl: string;
  }): Promise<CheckoutSession>;
  getPayment(providerPaymentId: string): Promise<ProviderPayment>;
  createRefund(input: {
    providerPaymentId: string;
    amount: MoneyWire;
    idempotencyKey: string;
  }): Promise<ProviderRefund>;
  getRefund(providerRefundId: string): Promise<ProviderRefund>;
  getNetworkDispute(providerDisputeId: string): Promise<ProviderDispute>;
  setPayoutRestriction?(input: { providerCreatorId: string; restricted: boolean }): Promise<void>;
  getPayout(providerPayoutId: string): Promise<ProviderPayout>;
  verifyAndNormalizeWebhook(rawBody: Uint8Array, headers: Headers): Promise<VerifiedProviderEvent>;
  fetchReconciliation(input: {
    from: string;
    to: string;
  }): Promise<{ items: CanonicalProviderEvent[] }>;
}

export function failClosedIfUnknown(
  capabilities: ProviderCapabilities,
  required: (keyof ProviderCapabilities)[],
): void {
  for (const key of required) {
    if (capabilities[key] === 'UNKNOWN' || capabilities[key] === 'UNSUPPORTED') {
      throw new Error(`Required provider capability ${key} is ${capabilities[key]}`);
    }
  }
}
