import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['tests/migrations.test.ts'], environment: 'node' },
});
