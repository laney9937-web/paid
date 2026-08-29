import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'tests/integration.test.ts',
      'apps/worker/src/processor.test.ts',
      'packages/provider-simulator/src/simulator.test.ts',
    ],
    environment: 'node',
  },
});
