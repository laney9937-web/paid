import postgres from 'postgres';
import { loadLocalEnv } from './load-env';

loadLocalEnv();
const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
const sql = postgres(url, { max: 1 });
try {
  await sql.unsafe(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO paid;
    GRANT ALL ON SCHEMA public TO public;
  `);
  console.log('schema reset');
} finally {
  await sql.end();
}
