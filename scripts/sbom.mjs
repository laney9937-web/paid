#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const lock = readFileSync(new URL('../pnpm-lock.yaml', import.meta.url), 'utf8');
const digest = createHash('sha256').update(lock).digest('hex');
const sbom = {
  bomFormat: 'Paid-SBOM',
  specVersion: '1.0',
  created: new Date().toISOString(),
  node: process.version,
  packageManager: 'pnpm@10.15.1',
  lockfileSha256: digest,
  components: [
    'next@16.3.3',
    'react@19.2.8',
    'drizzle-orm@0.45.2',
    'better-auth@1.7.2',
    'zod@4.5.4',
    'vitest@4.1.11',
  ],
};
mkdirSync(new URL('../docs/evidence', import.meta.url), { recursive: true });
writeFileSync(
  new URL('../docs/evidence/sbom.json', import.meta.url),
  JSON.stringify(sbom, null, 2),
);
console.log(`sbom lock=${digest}`);
