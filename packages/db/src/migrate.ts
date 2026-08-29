import { readFileSync } from 'node:fs';
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

const dir = dirname(fileURLToPath(import.meta.url));
const sqlFile = join(dir, 'migrations', '0001_init.sql');
const body = readFileSync(sqlFile, 'utf8');
const sql = postgres(url, { max: 1 });
try {
  await sql.unsafe(body);
  console.log('migrated 0001_init');
} finally {
  await sql.end();
}
