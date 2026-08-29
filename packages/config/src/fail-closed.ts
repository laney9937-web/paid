import type { AppConfig } from './env';

export type FailClosedFinding = Readonly<{
  code: string;
  message: string;
}>;

/**
 * Production startup must refuse to boot when a live-money invariant is violated.
 * Local/test PROVIDER_AGNOSTIC mock checkout is permitted.
 */
export function collectFailClosedFindings(
  config: AppConfig,
  health: {
    migrationsPending: boolean;
    auditAvailable: boolean;
    workerAvailable: boolean;
    outboxAvailable: boolean;
    reconciliationAvailable: boolean;
  },
): FailClosedFinding[] {
  const findings: FailClosedFinding[] = [];
  const isProduction = config.PAID_ENV === 'production' || config.NODE_ENV === 'production';
  const liveCheckout =
    config.PAYMENTS_ACCEPTANCE === 'live' || config.PAYMENTS_ACCEPTANCE === 'sandbox';

  if (isProduction && config.SIMULATOR_ENABLED) {
    findings.push({
      code: 'SIMULATOR_IN_PRODUCTION',
      message: 'Provider simulator cannot be enabled in production',
    });
  }

  if (isProduction && config.PROVIDER_MODE === 'mock' && config.CHECKOUT_ENABLED) {
    findings.push({
      code: 'MOCK_PAYMENTS_IN_PRODUCTION',
      message: 'Production startup rejects mock payments while payment acceptance is enabled',
    });
  }

  if (liveCheckout && config.PROVIDER_MODE === 'mock') {
    findings.push({
      code: 'MOCK_WITH_LIVE_ACCEPTANCE',
      message: 'Provider mode is mock while payment acceptance is sandbox/live',
    });
  }

  if (liveCheckout && config.liveJurisdictionAllowlist.length === 0 && config.CHECKOUT_ENABLED) {
    findings.push({
      code: 'EMPTY_LIVE_JURISDICTION_ALLOWLIST',
      message: 'Live jurisdiction allowlist is empty while checkout is enabled',
    });
  }

  if (liveCheckout && !config.MERCHANT_PORTFOLIO_ID) {
    findings.push({
      code: 'MISSING_MERCHANT_PORTFOLIO',
      message: 'Merchant portfolio/provider mapping is absent',
    });
  }

  if (liveCheckout && !config.PROVIDER_WEBHOOK_SECRET_CURRENT) {
    findings.push({
      code: 'MISSING_WEBHOOK_SECRET',
      message: 'Provider webhook/signature secrets are absent',
    });
  }

  if (health.migrationsPending && !config.MIGRATIONS_PENDING_OK) {
    findings.push({
      code: 'PENDING_MIGRATIONS',
      message: 'Database migrations are pending or schema compatibility check failed',
    });
  }

  if (!config.RESTRICTED_FIELD_KEY) {
    findings.push({
      code: 'MISSING_RESTRICTED_FIELD_KEY',
      message: 'Restricted-field encryption/key configuration is missing',
    });
  }

  if (isProduction && !config.OPS_STRONG_AUTH_REQUIRED) {
    findings.push({
      code: 'OPS_STRONG_AUTH_DISABLED',
      message: 'Ops strong-auth requirement is disabled',
    });
  }

  if (!health.auditAvailable) {
    findings.push({ code: 'AUDIT_UNAVAILABLE', message: 'Audit health is unavailable' });
  }
  if (!health.workerAvailable) {
    findings.push({ code: 'WORKER_UNAVAILABLE', message: 'Worker health is unavailable' });
  }
  if (!health.outboxAvailable) {
    findings.push({ code: 'OUTBOX_UNAVAILABLE', message: 'Outbox health is unavailable' });
  }
  if (!health.reconciliationAvailable) {
    findings.push({
      code: 'RECONCILIATION_UNAVAILABLE',
      message: 'Reconciliation health is unavailable',
    });
  }

  if (liveCheckout && !config.BUYER_PROTECTION_POLICY_VERSION) {
    findings.push({
      code: 'MISSING_PROTECTION_POLICY',
      message: 'Live buyer-protection/policy version is not configured',
    });
  }

  if (config.ADULT_LANE_ENABLED && config.PAID_BUILD_MODE !== 'PROVIDER_AGNOSTIC' && liveCheckout) {
    findings.push({
      code: 'ADULT_LANE_UNAPPROVED',
      message: 'Live adult lane is enabled without approved provider/compliance configuration',
    });
  }

  return findings;
}

export function assertBootAllowed(
  config: AppConfig,
  health: Parameters<typeof collectFailClosedFindings>[1],
): void {
  const findings = collectFailClosedFindings(config, health);
  if (findings.length > 0) {
    const detail = findings.map((f) => `${f.code}: ${f.message}`).join('; ');
    throw new Error(`Fail-closed startup: ${detail}`);
  }
}
