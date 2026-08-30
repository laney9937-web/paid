import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from '@playwright/test';

function loadDotEnvFile(file: string, into: Record<string, string>) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in into) && !(key in process.env)) into[key] = value;
  }
}

const fileEnv: Record<string, string> = {};
loadDotEnvFile(resolve(process.cwd(), '.env'), fileEnv);
loadDotEnvFile(resolve(process.cwd(), '.env.example'), fileEnv);

const databaseUrl =
  process.env.DATABASE_URL ??
  fileEnv.DATABASE_URL ??
  'postgres://paid:paid_local_only@127.0.0.1:5432/paid';

const serverEnv = {
  ...process.env,
  ...fileEnv,
  NODE_ENV: 'production',
  PAID_ENV: 'local',
  PAID_BUILD_MODE: 'PROVIDER_AGNOSTIC',
  DATABASE_URL: databaseUrl,
  TOKEN_HMAC_KEY_V1:
    process.env.TOKEN_HMAC_KEY_V1 ??
    fileEnv.TOKEN_HMAC_KEY_V1 ??
    'local-dev-token-hmac-key-v1-32bytes-min',
  PROVIDER_MODE: 'mock',
  WEB_ORIGIN: 'http://127.0.0.1:3000',
  OPS_ORIGIN: 'http://127.0.0.1:3001',
  BETTER_AUTH_URL: 'http://127.0.0.1:3000',
  PASSKEY_ORIGIN: 'http://127.0.0.1:3000',
  OPS_PASSKEY_ORIGIN: 'http://127.0.0.1:3001',
  NEXT_TELEMETRY_DISABLED: '1',
};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'off' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'pnpm --filter @paid/web exec next start --port 3000 --hostname 127.0.0.1',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: process.env.PW_REUSE === '1',
      timeout: 120000,
      env: serverEnv,
    },
    {
      command: 'pnpm --filter @paid/ops exec next start --port 3001 --hostname 127.0.0.1',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: process.env.PW_REUSE === '1',
      timeout: 120000,
      env: serverEnv,
    },
  ],
});
