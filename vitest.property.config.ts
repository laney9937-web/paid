import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/contracts/src/money.test.ts', 'packages/trust/src/trust.test.ts'],
    environment: 'node',
  },
});
