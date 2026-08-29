import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.next/**', '**/dist/**'],
    environment: 'node',
    reporters: ['default'],
    testTimeout: 15000,
  },
});
