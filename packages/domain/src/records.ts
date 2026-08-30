import type {
  ActorContext,
  CheckoutState,
  CreatorOnboardingState,
  DeliveryDuration,
  DisputeState,
  FulfillmentState,
  Lane,
  LinkState,
  Money,
  PaymentState,
  ReservationState,
  ReviewState,
  TaxResponsibility,
  TransactionCategory,
} from '@paid/contracts';

export type CreatorRecord = {
  id: string;
  userId: string;
  handle: string;
  displayName: string;
  onboardingState: CreatorOnboardingState;
  lane: Lane;
  identityState: 'VERIFIED' | 'PENDING' | 'REJECTED' | 'NEEDS_INFORMATION' | 'UNKNOWN';
  ageState: 'VERIFIED_ADULT' | 'PENDING' | 'REJECTED' | 'UNKNOWN';
  sanctionsState: 'CLEAR' | 'HIT' | 'REVIEW' | 'UNKNOWN';
  jurisdiction: string;
  memberSince: Date;
  version: number;
  restricted: boolean;
  payoutHold: boolean;
  newCheckoutBlocked: boolean;
};

export type LinkRecord = {
  id: string;
  creatorId: string;
  shareId: string;
  state: LinkState;
  amount: Money;
  category: TransactionCategory;
  deliveryDuration: DeliveryDuration;
  lane: Lane;
  note: string | null;
  termsHash: string;
  activatedAt: Date | null;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  version: number;
  createdAt: Date;
};

export type SnapshotRecord = {
  id: string;
  transactionId: string;
  creatorId: string;
  creatorHandle: string;
  creatorDisplayName: string;
  amount: Money;
  category: TransactionCategory;
  deliveryDuration: DeliveryDuration;
  lane: Lane;
  feeScheduleVersion: string;
  platformFee: Money;
  processorFeeEstimate: Money;
  reserveAmount: Money;
  buyerProtectionFee: Money;
  buyerProtectionPolicyVersion: string;
  creatorAgreementVersion: string;
  jurisdictionPolicyVersion: string;
  compliancePolicyVersion: string;
  providerConfigurationId: string;
  merchantPortfolioId: string;
  statementDescriptor: string;
  descriptorIsSynthetic: boolean;
  taxResponsibility: TaxResponsibility;
  taxAmount: Money;
  trustSnapshotId: string | null;
  policyVersion: string;
  createdAt: Date;
};

export type TransactionRecord = {
  id: string;
  linkId: string;
  creatorId: string;
  publicOrderCode: string;
  lane: Lane;
  providerConfigurationId: string;
  amount: Money;
  snapshotId: string;
  paymentState: PaymentState;
  fulfillmentState: FulfillmentState;
  providerAuthoritativePaidAt: Date | null;
  deliveryDeadlineAt: Date | null;
  version: number;
  createdAt: Date;
};

export type ReservationRecord = {
  id: string;
  linkId: string;
  transactionId: string;
  idempotencyScope: string;
  idempotencyKeyHash: string;
  state: ReservationState;
  providerConfigurationId: string;
  providerCheckoutId: string | null;
  createdAt: Date;
  expiresAt: Date;
  lastTruthCheckAt: Date | null;
  version: number;
};

export type CheckoutSessionRecord = {
  id: string;
  transactionId: string;
  reservationId: string;
  state: CheckoutState;
  redirectUrl: string | null;
  providerCheckoutId: string | null;
  createdAt: Date;
  version: number;
};

export type PaymentRecord = {
  id: string;
  transactionId: string;
  providerPaymentId: string | null;
  state: PaymentState;
  amount: Money;
  capturedAmount: Money;
  refundedAmount: Money;
  version: number;
};

export type GuestCredentialRecord = {
  id: string;
  transactionId: string;
  digestHex: string;
  keyVersion: string;
  purpose: 'ACCESS' | 'SESSION' | 'STEP_UP' | 'MAGIC_LINK' | 'EMAIL_CHANGE' | 'RECOVERY';
  expiresAt: Date;
  consumedAt: Date | null;
  revokedAt: Date | null;
  continuationIssuedAt: Date | null;
};

export type IdempotencyRecord = {
  id: string;
  scope: string;
  keyHash: string;
  requestHash: string;
  resultJson: string;
  createdAt: Date;
};

export type AuditRecord = {
  id: string;
  actor: ActorContext;
  action: string;
  subjectType: string;
  subjectId: string;
  beforeDigest?: string;
  afterDigest?: string;
  reason?: string;
  createdAt: Date;
};

export type OutboxRecord = {
  id: string;
  type: string;
  payload: unknown;
  dedupeKey: string;
  availableAt: Date;
  attemptCount: number;
  maxAttempts: number;
  state: 'PENDING' | 'LEASED' | 'COMPLETED' | 'DEAD_LETTER';
  lastError?: string;
  sideEffectAt?: Date | null;
};

export type DisputeRecord = {
  id: string;
  transactionId: string;
  state: DisputeState;
  openedBy: 'GUEST' | 'CREATOR' | 'OPS';
  reasonCode: string;
  createdAt: Date;
  version: number;
};

export type RefundRecord = {
  id: string;
  transactionId: string;
  amount: Money;
  state: 'REQUESTED' | 'SUBMITTED' | 'PROVIDER_PENDING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
  providerRefundId: string | null;
  createdAt: Date;
  version: number;
};

export type PayoutRecord = {
  id: string;
  creatorId: string;
  amount: Money;
  state:
    | 'REQUESTED'
    | 'RISK_REVIEW'
    | 'HELD'
    | 'ELIGIBLE'
    | 'SUBMITTED'
    | 'IN_TRANSIT'
    | 'PAID'
    | 'FAILED'
    | 'REVERSED'
    | 'CANCELLED';
  providerPayoutId: string | null;
  idempotencyKeyHash: string;
  requestedAt: Date;
  updatedAt: Date;
  version: number;
};

export type SecretEnvelopeRecord = {
  id: string;
  purpose: string;
  credentialId: string | null;
  ciphertext: Buffer | null;
  nonce: Buffer;
  authTag: Buffer | null;
  keyVersion: string;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
};

export type ReviewRecord = {
  id: string;
  transactionId: string;
  creatorId: string;
  state: ReviewState;
  rating: number | null;
  body: string | null;
  includedInAggregate: boolean;
  createdAt: Date;
};

export type LedgerLineInput = {
  accountCode: string;
  direction: 'DEBIT' | 'CREDIT';
  amount: Money;
  creatorId?: string;
};

export type LedgerEntryInput = {
  id: string;
  sourceType: string;
  sourceId: string;
  transactionId?: string;
  currency: Money['currency'];
  accountingRuleVersion: string;
  occurredAt: Date;
  lines: LedgerLineInput[];
};
