import { formatUsd, toWire, type Money } from '@paid/contracts';

export type PublicCreatorDTO = {
  handle: string;
  displayName: string;
  verified: boolean;
  trustTier: string | null;
  rating: number | null;
  completedCount: number | null;
  memberSince: string;
  ageVerifiedPublic: boolean;
};

export type CreatorTransactionDTO = {
  id: string;
  publicOrderCode: string;
  amount: { amountMinor: string; currency: 'USD'; formatted: string };
  fulfillmentState: string;
  paymentState: string;
  buyerDisplay: string;
  deadline: string | null;
};

export type GuestTransactionDTO = {
  publicOrderCode: string;
  amount: { amountMinor: string; currency: 'USD'; formatted: string };
  creatorHandle: string;
  creatorDisplayName: string;
  trustTier: string | null;
  paymentState: string;
  fulfillmentState: string;
  statementDescriptor: string;
  descriptorIsSynthetic: boolean;
  protectionPolicyVersion: string;
  deadline: string | null;
};

export function moneyDto(amount: Money) {
  return { ...toWire(amount), formatted: formatUsd(amount) };
}

export function publicCreatorDto(input: {
  handle: string;
  displayName: string;
  verified: boolean;
  trustTier: string | null;
  rating: number | null;
  completedCount: number | null;
  memberSince: Date;
  ageVerifiedPublic: boolean;
}): PublicCreatorDTO {
  return {
    handle: input.handle,
    displayName: input.displayName,
    verified: input.verified,
    trustTier: input.trustTier,
    rating: input.rating,
    completedCount: input.completedCount,
    memberSince: input.memberSince.toISOString(),
    ageVerifiedPublic: input.ageVerifiedPublic,
  };
}

export function creatorTransactionDto(input: {
  id: string;
  publicOrderCode: string;
  amount: Money;
  fulfillmentState: string;
  paymentState: string;
  deadline: Date | null;
}): CreatorTransactionDTO {
  return {
    id: input.id,
    publicOrderCode: input.publicOrderCode,
    amount: moneyDto(input.amount),
    fulfillmentState: input.fulfillmentState,
    paymentState: input.paymentState,
    buyerDisplay: 'Anonymous Buyer',
    deadline: input.deadline?.toISOString() ?? null,
  };
}

export function guestTransactionDto(input: {
  publicOrderCode: string;
  amount: Money;
  creatorHandle: string;
  creatorDisplayName: string;
  trustTier: string | null;
  paymentState: string;
  fulfillmentState: string;
  statementDescriptor: string;
  descriptorIsSynthetic: boolean;
  protectionPolicyVersion: string;
  deadline: Date | null;
}): GuestTransactionDTO {
  return {
    publicOrderCode: input.publicOrderCode,
    amount: moneyDto(input.amount),
    creatorHandle: input.creatorHandle,
    creatorDisplayName: input.creatorDisplayName,
    trustTier: input.trustTier,
    paymentState: input.paymentState,
    fulfillmentState: input.fulfillmentState,
    statementDescriptor: input.statementDescriptor,
    descriptorIsSynthetic: input.descriptorIsSynthetic,
    protectionPolicyVersion: input.protectionPolicyVersion,
    deadline: input.deadline?.toISOString() ?? null,
  };
}

const CREATOR_FORBIDDEN_FIELDS = [
  'buyerEmail',
  'pan',
  'cvv',
  'legalName',
  'billing',
  'deviceFingerprint',
  'guestToken',
  'riskScore',
] as const;

export function assertNoCreatorLeak(payload: unknown): void {
  const json = JSON.stringify(payload);
  for (const field of CREATOR_FORBIDDEN_FIELDS) {
    if (json.includes(`"${field}"`)) {
      throw new Error(`Creator DTO leaked ${field}`);
    }
  }
}
