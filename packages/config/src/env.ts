import { z } from 'zod';
import type { TokenKeyring } from '@paid/contracts';

const buildMode = z.enum(['PROVIDER_AGNOSTIC', 'PROVIDER_SANDBOX', 'PRODUCTION_MONEY']);
const paidEnv = z.enum(['local', 'test', 'staging', 'production']);
const providerMode = z.enum(['mock', 'sandbox', 'live']);
const paymentsAcceptance = z.enum(['disabled', 'mock', 'sandbox', 'live']);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PAID_ENV: paidEnv.default('local'),
  PAID_BUILD_MODE: buildMode.default('PROVIDER_AGNOSTIC'),
  PAID_LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  DATABASE_URL: z.string().min(1),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  OPS_ORIGIN: z.string().url().default('http://localhost:3001'),
  WEB_PORT: z.coerce.number().int().positive().default(3000),
  OPS_PORT: z.coerce.number().int().positive().default(3001),
  WORKER_CONCURRENCY: z.coerce.number().int().positive().max(32).default(4),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  PASSKEY_RP_ID: z.string().min(1),
  PASSKEY_RP_NAME: z.string().min(1).default('Paid'),
  PASSKEY_ORIGIN: z.string().url(),
  OPS_PASSKEY_RP_ID: z.string().min(1),
  OPS_PASSKEY_ORIGIN: z.string().url(),
  TOKEN_HMAC_KEY_V1: z.string().min(16),
  TOKEN_HMAC_PREVIOUS_KEY: z.string().optional().default(''),
  TOKEN_HMAC_CURRENT_VERSION: z.string().min(1).default('v1'),
  PROVIDER_MODE: providerMode.default('mock'),
  PAYMENTS_ACCEPTANCE: paymentsAcceptance.default('mock'),
  SIMULATOR_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  CHECKOUT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  PAYOUT_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  ADULT_LANE_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  REVIEW_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  NEW_LINKS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  JURISDICTION_ALLOWLIST: z.string().default('US'),
  LIVE_JURISDICTION_ALLOWLIST: z.string().default(''),
  POLICY_VERSION: z.string().min(1),
  FEE_SCHEDULE_VERSION: z.string().min(1),
  BUYER_PROTECTION_POLICY_VERSION: z.string().min(1),
  DESCRIPTOR_VERSION: z.string().min(1),
  TRUST_ALGORITHM_VERSION: z.string().min(1),
  RISK_RULES_VERSION: z.string().min(1),
  COMPLIANCE_POLICY_VERSION: z.string().min(1),
  RESTRICTED_FIELD_KEY: z.string().min(16),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional().default(''),
  OTEL_SERVICE_NAME: z.string().default('paid'),
  PROVIDER_WEBHOOK_SECRET_CURRENT: z.string().optional().default(''),
  PROVIDER_WEBHOOK_SECRET_PREVIOUS: z.string().optional().default(''),
  MERCHANT_PORTFOLIO_ID: z.string().min(1),
  OPS_STRONG_AUTH_REQUIRED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  MIGRATIONS_PENDING_OK: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type AppConfig = z.infer<typeof envSchema> & {
  jurisdictionAllowlist: string[];
  liveJurisdictionAllowlist: string[];
  tokenKeyring: TokenKeyring;
};

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(source);
  const keys: Record<string, string> = { v1: parsed.TOKEN_HMAC_KEY_V1 };
  if (parsed.TOKEN_HMAC_PREVIOUS_KEY) {
    keys['v0'] = parsed.TOKEN_HMAC_PREVIOUS_KEY;
  }
  return {
    ...parsed,
    jurisdictionAllowlist: splitList(parsed.JURISDICTION_ALLOWLIST),
    liveJurisdictionAllowlist: splitList(parsed.LIVE_JURISDICTION_ALLOWLIST),
    tokenKeyring: {
      currentVersion: parsed.TOKEN_HMAC_CURRENT_VERSION,
      keys,
    },
  };
}

export const envSchemaForTests = envSchema;
