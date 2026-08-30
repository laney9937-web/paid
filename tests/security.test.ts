import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { denyOrderCodeAuth } from '@paid/authorization';
import { AppError } from '@paid/contracts';
import { assertNoProhibitedFeatures } from '@paid/risk';
import { assertAppPath } from '../apps/web/src/server/app-path';

describe('security static and unit guards', () => {
  it('public order code is never treated as authentication', () => {
    expect(() => denyOrderCodeAuth()).toThrow(AppError);
  });

  it('risk engine rejects protected characteristic features', () => {
    expect(() => assertNoProhibitedFeatures(['amountVelocity', 'chargebackCount'])).not.toThrow();
    expect(() => assertNoProhibitedFeatures(['race'])).toThrow();
  });

  it('service worker does not cache private routes', () => {
    const sw = readFileSync(new URL('../apps/web/public/sw.js', import.meta.url), 'utf8');
    expect(sw).toContain("url.pathname.startsWith('/api')");
    expect(sw).toContain("url.pathname.startsWith('/guest')");
    expect(sw).toContain("url.pathname.startsWith('/transaction')");
  });

  it('app redirects refuse absolute and protocol-relative locations', () => {
    expect(assertAppPath('/transaction/ABC')).toBe('/transaction/ABC');
    expect(() => assertAppPath('https://evil.example/phish')).toThrow(/non-app/);
    expect(() => assertAppPath('//evil.example/phish')).toThrow(/non-app/);
  });

  it('no file upload inputs in web app', () => {
    const report = readFileSync(
      new URL('../apps/web/app/report/page.tsx', import.meta.url),
      'utf8',
    );
    expect(report.toLowerCase()).not.toContain('type="file"');
    expect(report).toContain('Do not upload files');
  });
});
