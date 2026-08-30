export const CREATOR_ONBOARDING_STATES = [
  'DRAFT',
  'IDENTITY_PENDING',
  'PROCESSOR_PENDING',
  'COMPLIANCE_REVIEW',
  'ACTIVE',
  'NEEDS_INFORMATION',
  'RESTRICTED',
  'SUSPENDED',
  'REJECTED',
  'CLOSED',
] as const;
export type CreatorOnboardingState = (typeof CREATOR_ONBOARDING_STATES)[number];

export const LINK_STATES = ['DRAFT', 'ACTIVE', 'USED', 'EXPIRED', 'CANCELLED', 'DISABLED'] as const;
export type LinkState = (typeof LINK_STATES)[number];

export const RESERVATION_STATES = [
  'RESERVED',
  'PROVIDER_CREATED',
  'RECONCILIATION_HOLD',
  'CAPTURED',
  'FAILED',
  'EXPIRED_RELEASED',
] as const;
export type ReservationState = (typeof RESERVATION_STATES)[number];

export const CHECKOUT_STATES = [
  'CREATED',
  'PROVIDER_CREATED',
  'REDIRECTED_OR_RENDERED',
  'RETURNED',
  'EXPIRED',
  'FAILED',
] as const;
export type CheckoutState = (typeof CHECKOUT_STATES)[number];

export const PAYMENT_STATES = [
  'CREATED',
  'AUTH_PENDING',
  'AUTHORIZED',
  'CAPTURED',
  'FAILED',
  'VOIDED',
  'CANCELLED',
  'UNKNOWN_REQUIRES_RECONCILIATION',
] as const;
export type PaymentState = (typeof PAYMENT_STATES)[number];

export const FULFILLMENT_STATES = [
  'AWAITING_DELIVERY',
  'CREATOR_MARKED_DELIVERED',
  'BUYER_ACCEPTED',
  'DISPUTED',
] as const;
export type FulfillmentState = (typeof FULFILLMENT_STATES)[number];

export const DISPUTE_STATES = [
  'OPEN',
  'TRIAGED',
  'AWAITING_CREATOR',
  'AWAITING_BUYER',
  'REVIEW',
  'BUYER_WON',
  'CREATOR_WON',
  'PARTIAL',
  'WITHDRAWN',
  'CLOSED',
] as const;
export type DisputeState = (typeof DISPUTE_STATES)[number];

export const REFUND_STATES = [
  'REQUESTED',
  'SUBMITTED',
  'PROVIDER_PENDING',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type RefundState = (typeof REFUND_STATES)[number];

export const PAYOUT_STATES = [
  'NOT_ELIGIBLE',
  'POLICY_HOLD',
  'RISK_HOLD',
  'COMPLIANCE_HOLD',
  'ELIGIBLE',
  'SCHEDULED',
  'IN_TRANSIT',
  'PAID',
  'FAILED',
  'REVERSED',
] as const;
export type PayoutState = (typeof PAYOUT_STATES)[number];

export const REVIEW_STATES = [
  'INELIGIBLE',
  'ELIGIBLE',
  'SUBMITTED',
  'PENDING_MODERATION',
  'PUBLISHED',
  'HIDDEN',
  'REMOVED',
  'APPEALED',
] as const;
export type ReviewState = (typeof REVIEW_STATES)[number];

export const COMPLIANCE_CASE_STATES = [
  'OPEN',
  'TRIAGE',
  'INVESTIGATING',
  'ACTION_REQUIRED',
  'CLEARED',
  'RESTRICTED',
  'REPORTED',
  'CLOSED',
] as const;
export type ComplianceCaseState = (typeof COMPLIANCE_CASE_STATES)[number];

export const COMPLIANCE_OUTCOMES = ['ALLOW', 'DENY', 'REVIEW'] as const;
export type ComplianceOutcome = (typeof COMPLIANCE_OUTCOMES)[number];

export const TAX_RESPONSIBILITIES = ['PROVIDER', 'PLATFORM', 'CREATOR', 'UNKNOWN'] as const;
export type TaxResponsibility = (typeof TAX_RESPONSIBILITIES)[number];

export const TRANSACTION_CATEGORIES = [
  'DIGITAL_COMMISSION',
  'CUSTOM_DIGITAL_CONTENT',
  'PREMADE_DIGITAL_CONTENT',
  'DIGITAL_SERVICE',
  'OTHER_PERMITTED_DIGITAL',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const LANES = ['ORDINARY', 'ADULT'] as const;
export type Lane = (typeof LANES)[number];

export const DELIVERY_DURATIONS = ['PT24H', 'PT48H', 'P7D'] as const;
export type DeliveryDuration = (typeof DELIVERY_DURATIONS)[number];

export const OUTBOX_STATES = ['PENDING', 'LEASED', 'COMPLETED', 'DEAD_LETTER'] as const;
export type OutboxState = (typeof OUTBOX_STATES)[number];

export const TNS_CATEGORIES = [
  'CHILD_SAFETY',
  'NON_CONSENSUAL',
  'PROSTITUTION_TRAFFICKING',
  'TRANSACTION_LAUNDERING',
  'IP_DMCA',
  'LEGAL_PRIVACY',
  'SANCTIONS',
  'IMPERSONATION',
  'REVIEW_ABUSE',
  'OTHER_PROHIBITED',
] as const;
export type TnsCategory = (typeof TNS_CATEGORIES)[number];
