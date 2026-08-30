import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { loadLocalEnv } from './load-env';

loadLocalEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
const files = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort();
const sql = postgres(url, { max: 1 });
try {
  for (const file of files) {
    await sql.unsafe(readFileSync(join(dir, file), 'utf8'));
    console.log(`migrated ${file.replace(/\.sql$/, '')}`);
  }
} finally {
  await sql.end();
}
