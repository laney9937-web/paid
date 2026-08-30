import { MOCK_POLICY } from '@paid/config';
import type { DomainConfig } from '@paid/domain';
import { loadLocalEnv } from './load-env';

export function postgresDomainConfig(): DomainConfig {
  loadLocalEnv();
  const hmac = process.env.TOKEN_HMAC_KEY_V1 ?? 'local-dev-token-hmac-key-v1-32bytes-min';
  const previous = process.env.TOKEN_HMAC_PREVIOUS_KEY ?? '';
  const keys: Record<string, string> = { v1: hmac };
  if (previous) keys.v0 = previous;
  return {
    policy: MOCK_POLICY,
    feeScheduleVersion: process.env.FEE_SCHEDULE_VERSION ?? 'fee.v2.mock',
    buyerProtectionPolicyVersion:
      process.env.BUYER_PROTECTION_POLICY_VERSION ?? 'protection.v1.mock',
    creatorAgreementVersion: 'agreement.v1.mock',
    jurisdictionPolicyVersion: 'jurisdiction.v1.mock',
    compliancePolicyVersion: process.env.COMPLIANCE_POLICY_VERSION ?? 'compliance.v1.mock',
    providerConfigurationId: 'mock-provider-config',
    merchantPortfolioId: process.env.MERCHANT_PORTFOLIO_ID ?? 'mock-portfolio-usd-digital',
    policyVersion: process.env.POLICY_VERSION ?? 'policy.v1.mock',
    trustAlgorithmVersion: process.env.TRUST_ALGORITHM_VERSION ?? 'trust.v1',
    tokenKeyring: {
      currentVersion: process.env.TOKEN_HMAC_CURRENT_VERSION ?? 'v1',
      keys,
    },
    restrictedFieldKeyring: {
      currentVersion: process.env.RESTRICTED_FIELD_CURRENT_VERSION ?? 'v1',
      keys: {
        v1: process.env.RESTRICTED_FIELD_KEY ?? 'local-dev-restricted-field-key-32b',
        ...(process.env.RESTRICTED_FIELD_PREVIOUS_KEY
          ? { v0: process.env.RESTRICTED_FIELD_PREVIOUS_KEY }
          : {}),
      },
    },
    checkoutEnabled: process.env.CHECKOUT_ENABLED !== 'false',
    newLinksEnabled: process.env.NEW_LINKS_ENABLED !== 'false',
    payoutEnabled: process.env.PAYOUT_ENABLED !== 'false',
    reviewEnabled: process.env.REVIEW_ENABLED !== 'false',
    adultLaneEnabled: process.env.ADULT_LANE_ENABLED === 'true',
    requireKnownBuyerJurisdiction: process.env.JURISDICTION_REQUIRE_BUYER !== 'false',
  };
}
