import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/security.test.ts', 'packages/observability/src/redaction.test.ts'],
    environment: 'node',
  },
});
