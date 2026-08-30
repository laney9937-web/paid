import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const ts = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  emailDigest: text('email_digest').notNull(),
  createdAt: ts('created_at').notNull(),
  updatedAt: ts('updated_at').notNull(),
  version: integer('version').notNull().default(1),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  kind: text('kind').notNull(),
  expiresAt: ts('expires_at').notNull(),
  createdAt: ts('created_at').notNull(),
  rotatedAt: ts('rotated_at'),
  authMethod: text('auth_method').notNull().default('EMAIL_LINK'),
  authStrength: text('auth_strength').notNull().default('EMAIL_LINK'),
  authenticatedAt: ts('authenticated_at'),
  stepUpExpiresAt: ts('step_up_expires_at'),
  revokedAt: ts('revoked_at'),
  lastUsedAt: ts('last_used_at'),
});

export const creatorProfiles = pgTable(
  'creator_profiles',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    handle: text('handle').notNull(),
    displayName: text('display_name').notNull(),
    onboardingState: text('onboarding_state').notNull(),
    lane: text('lane').notNull(),
    identityState: text('identity_state').notNull(),
    ageState: text('age_state').notNull(),
    sanctionsState: text('sanctions_state').notNull(),
    jurisdiction: text('jurisdiction').notNull(),
    memberSince: ts('member_since').notNull(),
    restricted: boolean('restricted').notNull().default(false),
    payoutHold: boolean('payout_hold').notNull().default(false),
    newCheckoutBlocked: boolean('new_checkout_blocked').notNull().default(false),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    handleUq: uniqueIndex('creator_handle_uq').on(t.handle),
    userUq: uniqueIndex('creator_user_uq').on(t.userId),
  }),
);

export const transactionLinks = pgTable(
  'transaction_links',
  {
    id: text('id').primaryKey(),
    creatorId: text('creator_id').notNull(),
    shareId: text('share_id').notNull(),
    state: text('state').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: text('currency').notNull(),
    category: text('category').notNull(),
    deliveryDuration: text('delivery_duration').notNull(),
    lane: text('lane').notNull(),
    note: text('note'),
    termsHash: text('terms_hash').notNull(),
    activatedAt: ts('activated_at'),
    expiresAt: ts('expires_at'),
    cancelledAt: ts('cancelled_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    shareUq: uniqueIndex('link_share_uq').on(t.shareId),
    creatorIdx: index('link_creator_idx').on(t.creatorId),
  }),
);

export const checkoutReservations = pgTable(
  'checkout_reservations',
  {
    id: text('id').primaryKey(),
    linkId: text('link_id').notNull(),
    transactionId: text('transaction_id').notNull(),
    idempotencyScope: text('idempotency_scope').notNull(),
    idempotencyKeyHash: text('idempotency_key_hash').notNull(),
    state: text('state').notNull(),
    providerConfigurationId: text('provider_configuration_id').notNull(),
    providerCheckoutId: text('provider_checkout_id'),
    createdAt: ts('created_at').notNull(),
    expiresAt: ts('expires_at').notNull(),
    lastTruthCheckAt: ts('last_truth_check_at'),
    updatedAt: ts('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    providerCheckoutUq: uniqueIndex('reservation_provider_checkout_uq').on(
      t.providerConfigurationId,
      t.providerCheckoutId,
    ),
  }),
);

export const transactions = pgTable(
  'transactions',
  {
    id: text('id').primaryKey(),
    linkId: text('link_id').notNull(),
    creatorId: text('creator_id').notNull(),
    publicOrderCode: text('public_order_code').notNull(),
    lane: text('lane').notNull(),
    providerConfigurationId: text('provider_configuration_id').notNull(),
    amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
    currency: text('currency').notNull(),
    snapshotId: text('snapshot_id').notNull(),
    paymentState: text('payment_state').notNull(),
    fulfillmentState: text('fulfillment_state').notNull(),
    providerAuthoritativePaidAt: ts('provider_authoritative_paid_at'),
    deliveryDeadlineAt: ts('delivery_deadline_at'),
    createdAt: ts('created_at').notNull(),
    updatedAt: ts('updated_at').notNull(),
    version: integer('version').notNull().default(1),
  },
  (t) => ({
    orderUq: uniqueIndex('tx_order_code_uq').on(t.publicOrderCode),
    creatorIdx: index('tx_creator_idx').on(t.creatorId),
  }),
);

export const transactionTermsSnapshots = pgTable('transaction_terms_snapshots', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  creatorId: text('creator_id').notNull(),
  creatorHandle: text('creator_handle').notNull(),
  creatorDisplayName: text('creator_display_name').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  category: text('category').notNull(),
  deliveryDuration: text('delivery_duration').notNull(),
  lane: text('lane').notNull(),
  feeScheduleVersion: text('fee_schedule_version').notNull(),
  platformFeeMinor: bigint('platform_fee_minor', { mode: 'bigint' }).notNull(),
  processorFeeEstimateMinor: bigint('processor_fee_estimate_minor', { mode: 'bigint' }).notNull(),
  reserveAmountMinor: bigint('reserve_amount_minor', { mode: 'bigint' }).notNull(),
  buyerProtectionFeeMinor: bigint('buyer_protection_fee_minor', { mode: 'bigint' })
    .notNull()
    .default(0n),
  buyerProtectionPolicyVersion: text('buyer_protection_policy_version').notNull(),
  creatorAgreementVersion: text('creator_agreement_version').notNull(),
  jurisdictionPolicyVersion: text('jurisdiction_policy_version').notNull(),
  compliancePolicyVersion: text('compliance_policy_version').notNull(),
  providerConfigurationId: text('provider_configuration_id').notNull(),
  merchantPortfolioId: text('merchant_portfolio_id').notNull(),
  statementDescriptor: text('statement_descriptor').notNull(),
  descriptorIsSynthetic: boolean('descriptor_is_synthetic').notNull(),
  taxResponsibility: text('tax_responsibility').notNull(),
  taxAmountMinor: bigint('tax_amount_minor', { mode: 'bigint' }).notNull(),
  trustSnapshotId: text('trust_snapshot_id'),
  policyVersion: text('policy_version').notNull(),
  createdAt: ts('created_at').notNull(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  providerPaymentId: text('provider_payment_id'),
  state: text('state').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  capturedMinor: bigint('captured_minor', { mode: 'bigint' }).notNull(),
  refundedMinor: bigint('refunded_minor', { mode: 'bigint' }).notNull(),
  createdAt: ts('created_at').notNull(),
  updatedAt: ts('updated_at').notNull(),
  version: integer('version').notNull().default(1),
});

export const guestCredentials = pgTable(
  'guest_transaction_credentials',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id').notNull(),
    digestHex: text('digest_hex').notNull(),
    keyVersion: text('key_version').notNull(),
    purpose: text('purpose').notNull(),
    expiresAt: ts('expires_at').notNull(),
    consumedAt: ts('consumed_at'),
    revokedAt: ts('revoked_at'),
    continuationIssuedAt: ts('continuation_issued_at'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => ({
    digestUq: uniqueIndex('guest_digest_uq').on(t.digestHex),
  }),
);

export const idempotencyRecords = pgTable(
  'idempotency_records',
  {
    id: text('id').primaryKey(),
    scope: text('scope').notNull(),
    keyHash: text('key_hash').notNull(),
    requestHash: text('request_hash').notNull(),
    resultJson: text('result_json').notNull(),
    createdAt: ts('created_at').notNull(),
  },
  (t) => ({
    scopeKeyUq: uniqueIndex('idempotency_scope_key_uq').on(t.scope, t.keyHash),
  }),
);

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(),
  actorJson: jsonb('actor_json').notNull(),
  action: text('action').notNull(),
  subjectType: text('subject_type').notNull(),
  subjectId: text('subject_id').notNull(),
  beforeDigest: text('before_digest'),
  afterDigest: text('after_digest'),
  reason: text('reason'),
  createdAt: ts('created_at').notNull(),
});

export const outboxJobs = pgTable(
  'outbox_jobs',
  {
    id: text('id').primaryKey(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull(),
    dedupeKey: text('dedupe_key').notNull(),
    availableAt: ts('available_at').notNull(),
    attemptCount: integer('attempt_count').notNull().default(0),
    maxAttempts: integer('max_attempts').notNull().default(8),
    state: text('state').notNull(),
    leaseUntil: ts('lease_until'),
    lastError: text('last_error'),
    completedAt: ts('completed_at'),
    createdAt: ts('created_at').notNull(),
  },
  (t) => ({
    dedupeUq: uniqueIndex('outbox_dedupe_uq').on(t.dedupeKey),
    claimIdx: index('outbox_claim_idx').on(t.state, t.availableAt),
  }),
);

export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey(),
  sourceType: text('source_type').notNull(),
  sourceId: text('source_id').notNull(),
  transactionId: text('transaction_id'),
  currency: text('currency').notNull(),
  accountingRuleVersion: text('accounting_rule_version').notNull(),
  occurredAt: ts('occurred_at').notNull(),
  recordedAt: ts('recorded_at').notNull(),
});

export const ledgerPostings = pgTable('ledger_postings', {
  id: text('id').primaryKey(),
  entryId: text('entry_id').notNull(),
  accountCode: text('account_code').notNull(),
  direction: text('direction').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  creatorId: text('creator_id'),
});

export const providerEventsInbox = pgTable(
  'provider_events_inbox',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull(),
    providerEventId: text('provider_event_id').notNull(),
    keyVersion: text('key_version').notNull(),
    rawDigest: text('raw_digest').notNull(),
    signatureValid: boolean('signature_valid').notNull(),
    eventType: text('event_type').notNull(),
    schemaVersion: integer('schema_version').notNull(),
    occurredAt: ts('occurred_at').notNull(),
    receivedAt: ts('received_at').notNull(),
    processedAt: ts('processed_at'),
    outcome: text('outcome'),
    payload: jsonb('payload'),
  },
  (t) => ({
    providerEventUq: uniqueIndex('provider_event_id_uq').on(t.provider, t.providerEventId),
  }),
);

export const reviews = pgTable(
  'reviews',
  {
    id: text('id').primaryKey(),
    transactionId: text('transaction_id').notNull(),
    creatorId: text('creator_id').notNull(),
    state: text('state').notNull(),
    rating: integer('rating'),
    body: text('body'),
    includedInAggregate: boolean('included_in_aggregate').notNull().default(true),
    createdAt: ts('created_at').notNull(),
  },
  (t) => ({
    oneReview: uniqueIndex('review_one_per_tx').on(t.transactionId),
  }),
);

export const refunds = pgTable('refunds', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  amountMinor: bigint('amount_minor', { mode: 'bigint' }).notNull(),
  currency: text('currency').notNull(),
  state: text('state').notNull(),
  providerRefundId: text('provider_refund_id'),
  createdAt: ts('created_at').notNull(),
});

export const internalDisputes = pgTable('internal_disputes', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  state: text('state').notNull(),
  openedBy: text('opened_by').notNull(),
  reasonCode: text('reason_code').notNull(),
  createdAt: ts('created_at').notNull(),
  updatedAt: ts('updated_at').notNull(),
  version: integer('version').notNull().default(1),
});

export const checkoutSessions = pgTable('checkout_sessions', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').notNull(),
  reservationId: text('reservation_id').notNull(),
  state: text('state').notNull(),
  redirectUrl: text('redirect_url'),
  providerCheckoutId: text('provider_checkout_id'),
  createdAt: ts('created_at').notNull(),
  updatedAt: ts('updated_at').notNull(),
  version: integer('version').notNull().default(1),
});

export const schemaVersion = pgTable('schema_migrations', {
  version: text('version').primaryKey(),
  appliedAt: ts('applied_at').notNull(),
});
