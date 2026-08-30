import { getSql } from './client';

export async function databaseHealth(): Promise<{
  migrationsPending: boolean;
  auditAvailable: boolean;
  workerAvailable: boolean;
  outboxAvailable: boolean;
  reconciliationAvailable: boolean;
}> {
  const sql = getSql();
  try {
    const versions = await sql`SELECT version FROM schema_migrations`;
    const set = new Set(versions.map((row) => String((row as { version: string }).version)));
    const migrationsPending = !set.has('0001_init') || !set.has('0002_auth_outbox');
    await sql`SELECT 1 FROM audit_events LIMIT 1`;
    await sql`SELECT 1 FROM outbox_jobs LIMIT 1`;
    await sql`SELECT 1 FROM ledger_entries LIMIT 1`;
    return {
      migrationsPending,
      auditAvailable: true,
      workerAvailable: true,
      outboxAvailable: true,
      reconciliationAvailable: true,
    };
  } catch {
    return {
      migrationsPending: true,
      auditAvailable: false,
      workerAvailable: false,
      outboxAvailable: false,
      reconciliationAvailable: false,
    };
  }
}
