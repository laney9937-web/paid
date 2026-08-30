import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loadLocalEnv(): void {
  if (process.env.PAID_ENV === 'production' || process.env.PAID_BUILD_MODE === 'PRODUCTION_MONEY') {
    return;
  }
  const here = dirname(fileURLToPath(import.meta.url));
  const names = ['.env', '.env.example'] as const;
  const roots = [
    process.cwd(),
    resolve(process.cwd(), '../..'),
    resolve(here, '../../..'),
    resolve(here, '../../../..'),
  ];
  const candidates = roots.flatMap((root) => names.map((name) => resolve(root, name)));
  const seen = new Set<string>();
  for (const file of candidates) {
    if (seen.has(file) || !existsSync(file)) continue;
    seen.add(file);
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (!(key in process.env)) process.env[key] = value;
    }
  }
}
