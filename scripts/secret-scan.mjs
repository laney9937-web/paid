#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const skip = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'coverage',
  'playwright-report',
  'test-results',
  '.pnpm-store',
]);

const patterns = [
  { name: 'private-key', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'aws-access-key', re: /AKIA[0-9A-Z]{16}/ },
  {
    name: 'generic-secret-assignment',
    re: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"](?!local-dev|test-|changeme|paid_local)[A-Za-z0-9/+_-]{24,}['"]/i,
  },
];

const findings = [];
try {
  const trackedEnv = execSync('git ls-files -- .env .env.local .env.*.local', {
    encoding: 'utf8',
  }).trim();
  if (trackedEnv) {
    for (const file of trackedEnv.split('\n').filter(Boolean)) {
      findings.push({ file, name: 'tracked-env-file' });
    }
  }
} catch {
  /* git unavailable */
}

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const full = join(dir, entry);
    const rel = full.slice(root.length + 1);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full);
      continue;
    }
    if (entry === '.env' || entry.startsWith('.env.')) continue;
    if (!/\.(ts|tsx|js|mjs|json|md|yml|yaml|sql|example)$/.test(entry)) continue;
    const text = readFileSync(full, 'utf8');
    for (const pattern of patterns) {
      if (pattern.re.test(text)) findings.push({ file: rel, name: pattern.name });
    }
  }
}

walk(root);
if (findings.length) {
  console.error(findings);
  process.exit(1);
}
console.log('SECRET_SCAN_OK');
