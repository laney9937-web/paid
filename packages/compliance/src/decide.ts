import type { ComplianceOutcome, Lane } from '@paid/contracts';

export type ComplianceInput = {
  buildMode: 'PROVIDER_AGNOSTIC' | 'PROVIDER_SANDBOX' | 'PRODUCTION_MONEY';
  creatorOnboardingState: string;
  identityState: string;
  ageState: string;
  sanctionsState: string;
  creatorJurisdiction: string;
  buyerJurisdiction?: string;
  requireKnownBuyerJurisdiction?: boolean;
  allowlist: string[];
  lane: Lane;
  adultLaneEnabled: boolean;
  checkoutEnabled: boolean;
  ticketMinor: bigint;
  minTicketMinor: bigint;
  maxTicketMinor: bigint;
  requiredStatesKnown: boolean;
};

export type ComplianceDecision = {
  outcome: ComplianceOutcome;
  policyVersion: string;
  reasons: string[];
};

const US_PREFIX = /^US(?:-|$)/;

export function decideCheckout(
  input: ComplianceInput,
  policyVersion = 'compliance.v1.mock',
): ComplianceDecision {
  const reasons: string[] = [];
  if (!input.checkoutEnabled) {
    return { outcome: 'DENY', policyVersion, reasons: ['CHECKOUT_DISABLED'] };
  }
  if (
    !input.requiredStatesKnown ||
    input.sanctionsState === 'UNKNOWN' ||
    input.identityState === 'UNKNOWN'
  ) {
    return { outcome: 'DENY', policyVersion, reasons: ['REQUIRED_STATE_UNKNOWN'] };
  }
  if (input.sanctionsState === 'HIT') {
    return { outcome: 'DENY', policyVersion, reasons: ['SANCTIONS_HIT'] };
  }
  if (input.sanctionsState === 'REVIEW') {
    return { outcome: 'REVIEW', policyVersion, reasons: ['SANCTIONS_REVIEW'] };
  }
  if (input.creatorOnboardingState !== 'ACTIVE') {
    return { outcome: 'DENY', policyVersion, reasons: ['CREATOR_NOT_ACTIVE'] };
  }
  if (input.identityState !== 'VERIFIED') {
    return { outcome: 'DENY', policyVersion, reasons: ['IDENTITY_NOT_VERIFIED'] };
  }
  if (input.lane === 'ADULT' && input.ageState !== 'VERIFIED_ADULT') {
    return { outcome: 'DENY', policyVersion, reasons: ['AGE_NOT_VERIFIED'] };
  }
  if (input.lane === 'ADULT' && !input.adultLaneEnabled) {
    return { outcome: 'DENY', policyVersion, reasons: ['ADULT_LANE_DISABLED'] };
  }
  const creatorOk = input.allowlist.some(
    (item) =>
      input.creatorJurisdiction === item || input.creatorJurisdiction.startsWith(`${item}-`),
  );
  if (!creatorOk || !US_PREFIX.test(input.creatorJurisdiction)) {
    return { outcome: 'DENY', policyVersion, reasons: ['JURISDICTION_BLOCKED'] };
  }
  if (
    input.requireKnownBuyerJurisdiction &&
    (!input.buyerJurisdiction || input.buyerJurisdiction === 'UNKNOWN')
  ) {
    return { outcome: 'DENY', policyVersion, reasons: ['JURISDICTION_BLOCKED'] };
  }
  if (input.buyerJurisdiction) {
    const buyerOk = input.allowlist.some(
      (item) => input.buyerJurisdiction === item || input.buyerJurisdiction!.startsWith(`${item}-`),
    );
    if (!buyerOk) {
      return { outcome: 'DENY', policyVersion, reasons: ['JURISDICTION_BLOCKED'] };
    }
  }
  if (input.ticketMinor < input.minTicketMinor || input.ticketMinor > input.maxTicketMinor) {
    return { outcome: 'DENY', policyVersion, reasons: ['LIMIT_EXCEEDED'] };
  }
  if (input.ageState === 'PENDING') {
    return { outcome: 'REVIEW', policyVersion, reasons: ['IDENTITY_PENDING'] };
  }
  return { outcome: 'ALLOW', policyVersion, reasons };
}

export function publicReason(decision: ComplianceDecision): string {
  if (decision.outcome === 'ALLOW') return 'Allowed';
  if (decision.reasons.includes('JURISDICTION_BLOCKED')) {
    return 'This purchase is not available in the selected region.';
  }
  return 'This purchase cannot be completed.';
}
