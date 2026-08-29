import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadLocalEnv(): void {
  const path = resolve(process.cwd(), '../../.env');
  const alt = resolve(process.cwd(), '.env');
  const file = existsSync(path) ? path : existsSync(alt) ? alt : null;
  if (!file) return;
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
