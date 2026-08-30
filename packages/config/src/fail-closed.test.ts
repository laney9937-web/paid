import { describe, expect, it } from 'vitest';
import { collectFailClosedFindings, loadConfig } from './index';

function baseEnv(overrides: Record<string, string> = {}) {
  return {
    DATABASE_URL: 'postgres://paid:paid@localhost:5432/paid',
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    BETTER_AUTH_URL: 'http://localhost:3000',
    PASSKEY_RP_ID: 'localhost',
    PASSKEY_ORIGIN: 'http://localhost:3000',
    OPS_PASSKEY_RP_ID: 'localhost',
    OPS_PASSKEY_ORIGIN: 'http://localhost:3001',
    TOKEN_HMAC_KEY_V1: 'y'.repeat(32),
    POLICY_VERSION: 'p',
    FEE_SCHEDULE_VERSION: 'f',
    BUYER_PROTECTION_POLICY_VERSION: 'b',
    DESCRIPTOR_VERSION: 'd',
    TRUST_ALGORITHM_VERSION: 't',
    RISK_RULES_VERSION: 'r',
    COMPLIANCE_POLICY_VERSION: 'c',
    RESTRICTED_FIELD_KEY: 'z'.repeat(32),
    MERCHANT_PORTFOLIO_ID: 'mock',
    ...overrides,
  };
}

const healthy = {
  migrationsPending: false,
  auditAvailable: true,
  workerAvailable: true,
  outboxAvailable: true,
  reconciliationAvailable: true,
};

describe('fail-closed startup', () => {
  it('allows local mock checkout', () => {
    const config = loadConfig(baseEnv({ PAID_ENV: 'local', NODE_ENV: 'development' }));
    expect(collectFailClosedFindings(config, healthy)).toEqual([]);
  });

  it('allows next start (NODE_ENV=production) in local PROVIDER_AGNOSTIC mock mode', () => {
    const config = loadConfig(
      baseEnv({
        PAID_ENV: 'local',
        NODE_ENV: 'production',
        PAID_BUILD_MODE: 'PROVIDER_AGNOSTIC',
        PROVIDER_MODE: 'mock',
        SIMULATOR_ENABLED: 'true',
        CHECKOUT_ENABLED: 'true',
      }),
    );
    expect(collectFailClosedFindings(config, healthy)).toEqual([]);
  });

  it('rejects production with mock payments enabled', () => {
    const config = loadConfig(
      baseEnv({
        PAID_ENV: 'production',
        NODE_ENV: 'production',
        PROVIDER_MODE: 'mock',
        CHECKOUT_ENABLED: 'true',
        SIMULATOR_ENABLED: 'false',
      }),
    );
    const codes = collectFailClosedFindings(config, healthy).map((f) => f.code);
    expect(codes).toContain('MOCK_PAYMENTS_IN_PRODUCTION');
  });

  it('rejects live checkout with empty live jurisdiction allowlist', () => {
    const config = loadConfig(
      baseEnv({
        PAYMENTS_ACCEPTANCE: 'live',
        PROVIDER_MODE: 'live',
        CHECKOUT_ENABLED: 'true',
        LIVE_JURISDICTION_ALLOWLIST: '',
        PROVIDER_WEBHOOK_SECRET_CURRENT: 'secret',
        SIMULATOR_ENABLED: 'false',
      }),
    );
    const codes = collectFailClosedFindings(config, healthy).map((f) => f.code);
    expect(codes).toContain('EMPTY_LIVE_JURISDICTION_ALLOWLIST');
  });
});
