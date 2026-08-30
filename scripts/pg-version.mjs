#!/usr/bin/env node
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });
try {
  const rows = await sql`SHOW server_version`;
  const version = String(rows[0]?.server_version ?? '');
  console.log(`postgres ${version}`);
  if (!version.startsWith('18')) {
    console.error('PostgreSQL 18 is required');
    process.exit(1);
  }
} finally {
  await sql.end({ timeout: 2 });
}
