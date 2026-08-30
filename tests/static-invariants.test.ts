import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (
      entry === 'node_modules' ||
      entry === '.next' ||
      entry === 'dist' ||
      entry === 'prototype' ||
      entry === '.git'
    ) {
      continue;
    }
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) walk(full, acc);
    else if (/\.(ts|tsx|js|mjs|css|md)$/.test(entry)) acc.push(full);
  }
  return acc;
}

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8');
}

describe('static product and security invariants', () => {
  it('PROD-010/D-09 no subscriptions, wallet, P2P, media upload, or live processor names in apps', () => {
    const appFiles = walk(join(root, 'apps')).filter((f) => !f.includes('/dist/'));
    const blob = appFiles.map((f) => readFileSync(f, 'utf8')).join('\n');
    expect(blob).not.toMatch(/type=["']file["']/);
    expect(blob.toLowerCase()).not.toContain('localstorage');
    expect(blob).not.toContain('Access-Control-Allow-Origin');
    expect(blob).not.toMatch(/Segpay|CCBill|Verotel/);
    expect(blob).not.toMatch(/\bINSTANT_PAYOUT\b/);
  });

  it('H-04/H-08 service worker never caches private routes and no auth token storage', () => {
    const sw = read('apps/web/public/sw.js');
    expect(sw).toContain("url.pathname.startsWith('/api')");
    expect(sw).toContain("url.pathname.startsWith('/guest')");
    expect(sw).toContain("url.pathname.startsWith('/transaction')");
    expect(sw).not.toContain('localStorage');
  });

  it('H-03/H-05/H-06 web headers include CSP, HSTS, nosniff, robots', () => {
    const config = read('apps/web/next.config.ts');
    expect(config).toContain('Content-Security-Policy');
    expect(config).toContain("default-src 'self'");
    expect(config).toContain("script-src 'self' 'unsafe-inline'");
    expect(config).toContain('Strict-Transport-Security');
    expect(config).toContain('X-Content-Type-Options');
    expect(config).toContain('noindex, nofollow');
    expect(config).toContain('private, no-store');
    expect(config).not.toMatch(/Access-Control-Allow-Origin['":\s]*\*/);
  });

  it('H-09 no dangerouslySetInnerHTML XSS sinks in web/ops', () => {
    const files = [...walk(join(root, 'apps/web')), ...walk(join(root, 'apps/ops'))];
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        expect(readFileSync(file, 'utf8')).not.toContain('dangerouslySetInnerHTML');
      }
    }
  });

  it('H-10 COMP-009 no arbitrary user-URL server fetch', () => {
    const routes = walk(join(root, 'apps/web/app/api'));
    for (const file of routes) {
      const src = readFileSync(file, 'utf8');
      expect(src).not.toMatch(/fetch\(\s*(body|url|input\.url|req\.url)/);
    }
  });

  it('BUILD-007 no latest/prerelease critical deps in package.json files', () => {
    const manifests = [
      'package.json',
      'apps/web/package.json',
      'apps/ops/package.json',
      'apps/worker/package.json',
    ];
    for (const file of manifests) {
      const json = read(file);
      expect(json).not.toMatch(/":\s*"latest"/);
      expect(json).not.toMatch(/":\s*"\^/);
      expect(json).not.toMatch(/":\s*"~/);
    }
  });

  it('BRAND-01/02/03 customer copy uses Paid and paid.example without escrow/trademark claims', () => {
    const copy = [
      read('apps/web/app/layout.tsx'),
      read('apps/web/app/t/[shareId]/page.tsx'),
      read('apps/web/app/c/[handle]/page.tsx'),
      read('apps/web/app/checkout/return/[provider]/page.tsx'),
      read('apps/ops/app/layout.tsx'),
    ].join('\n');
    expect(copy).toContain('Paid');
    expect(copy.toLowerCase()).not.toContain('escrow');
    expect(copy.toLowerCase()).not.toContain('trademark');
    expect(copy.toLowerCase()).not.toContain('guaranteed purchase');
    const blob = walk(join(root, 'apps'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    expect(blob).not.toMatch(/gmail\.com|yahoo\.com|stripe\.com|paypal\.com/);
  });

  it('K-10 reduced motion is encoded in design tokens', () => {
    const tokens = read('packages/ui/src/tokens.css');
    expect(tokens).toContain('prefers-reduced-motion');
    expect(tokens).toContain('animation: none');
  });

  it('I-01 passkey RP and origin are pinned in Better Auth wiring', () => {
    const src = read('packages/auth/src/better-auth.ts');
    expect(src).toContain('rpID: opts.rpID');
    expect(src).toContain('origin: opts.origin');
    expect(src).toContain('trustedOrigins: [opts.origin]');
    expect(src).toContain("rpName: 'Paid'");
  });

  it('J-06 email templates never carry raw buyer email', () => {
    const core = read('packages/email-core/src/index.ts');
    expect(core).toContain('toDigest');
    expect(core).not.toMatch(/to:\s*string/);
  });

  it('L-05/L-12/L-13 runbooks, canonical event versioning, and SBOM exist', () => {
    expect(read('docs/runbooks/provider-outage.md')).toContain('Immediate containment');
    expect(read('packages/contracts/src/events.ts')).toContain('schemaVersion');
    expect(read('docs/evidence/sbom.json')).toContain('bomFormat');
    const checkout = read('packages/domain/src/commands/create-checkout.ts');
    expect(checkout.toLowerCase()).not.toContain('analytics');
  });
});
