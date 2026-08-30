import { defineConfig } from '@playwright/test';

const databaseUrl =
  process.env.DATABASE_URL ?? 'postgres://paid:paid_local_only@127.0.0.1:5432/paid';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 45000,
  retries: 0,
  use: { baseURL: 'http://127.0.0.1:3000', trace: 'off' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: [
    {
      command: 'pnpm --filter @paid/web start',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: process.env.PW_REUSE === '1',
      timeout: 120000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        DATABASE_URL: databaseUrl,
        TOKEN_HMAC_KEY_V1:
          process.env.TOKEN_HMAC_KEY_V1 ?? 'local-dev-token-hmac-key-v1-32bytes-min',
        PROVIDER_MODE: 'mock',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
    {
      command: 'pnpm --filter @paid/ops start',
      url: 'http://127.0.0.1:3001',
      reuseExistingServer: process.env.PW_REUSE === '1',
      timeout: 120000,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    },
  ],
});
