export const KILL_SWITCHES = [
  'checkout_enabled',
  'payout_enabled',
  'adult_lane_enabled',
  'review_enabled',
  'new_links_enabled',
] as const;

export type KillSwitch = (typeof KILL_SWITCHES)[number];

export const MOCK_POLICY = {
  linkExpiryDays: 7,
  checkoutReservationMinutes: 15,
  deliveryChoices: ['PT24H', 'PT48H', 'P7D'] as const,
  creatorDisputeResponseHours: 48,
  reviewWindowDays: 30,
  autoCompletionEnabled: false,
  platformTakeRateBps: 1000,
  processorEstimateBps: 290,
  processorFixedMinor: 30,
  reserveBps: 1000,
  reserveHoldDays: 14,
  payoutCooldownHours: 48,
  statementDescriptor: 'TRUST*CREATOR',
  statementDescriptorQualified: true,
  descriptorIsSynthetic: true,
  minTicketMinor: 500,
  maxTicketMinor: 500_000,
  taxResponsibility: 'PLATFORM_MOCK_ZERO_TAX',
} as const;
