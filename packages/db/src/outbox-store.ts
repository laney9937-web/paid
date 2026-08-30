import type { OutboxRecord } from '@paid/domain';
import { getSql } from './client';

export type RuntimeJob = OutboxRecord & { sideEffectAt?: Date | null };

export interface OutboxRuntime {
  now(): Date;
  leaseDueJobs(limit: number): Promise<RuntimeJob[]>;
  markSideEffect(id: string, at: Date): Promise<void>;
  ack(id: string): Promise<void>;
  retry(id: string, error: string, availableAt: Date): Promise<void>;
  deadLetter(id: string, error: string): Promise<void>;
}

function mapJob(row: Record<string, unknown>): RuntimeJob {
  return {
    id: String(row.id),
    type: String(row.type),
    payload: row.payload,
    dedupeKey: String(row.dedupe_key),
    availableAt: new Date(String(row.available_at)),
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    state: row.state as RuntimeJob['state'],
    lastError: row.last_error == null ? undefined : String(row.last_error),
    sideEffectAt: row.side_effect_at == null ? null : new Date(String(row.side_effect_at)),
  };
}

export function createPostgresOutboxRuntime(): OutboxRuntime {
  const sql = getSql();
  return {
    now: () => new Date(),
    async leaseDueJobs(limit: number) {
      const now = new Date();
      return sql.begin(async (tx) => {
        const rows = await tx`
          SELECT * FROM outbox_jobs
          WHERE (
            (state = 'PENDING' AND available_at <= ${now})
            OR (state = 'LEASED' AND (lease_until IS NULL OR lease_until < ${now}))
          )
          ORDER BY available_at
          LIMIT ${limit}
          FOR UPDATE SKIP LOCKED
        `;
        const jobs: RuntimeJob[] = [];
        for (const raw of rows) {
          const row = raw as Record<string, unknown>;
          const id = String(row.id);
          const attempt = Number(row.attempt_count) + 1;
          const leaseUntil = new Date(now.getTime() + 30_000);
          await tx`
            UPDATE outbox_jobs
            SET state = 'LEASED', attempt_count = ${attempt}, lease_until = ${leaseUntil}
            WHERE id = ${id}
          `;
          jobs.push({ ...mapJob(row), attemptCount: attempt, state: 'LEASED' });
        }
        return jobs;
      });
    },
    async markSideEffect(id, at) {
      await sql`UPDATE outbox_jobs SET side_effect_at = ${at} WHERE id = ${id}`;
    },
    async ack(id) {
      await sql`
        UPDATE outbox_jobs
        SET state = 'COMPLETED', completed_at = ${new Date()}, lease_until = null
        WHERE id = ${id}
      `;
    },
    async retry(id, error, availableAt) {
      await sql`
        UPDATE outbox_jobs
        SET state = 'PENDING', last_error = ${error}, available_at = ${availableAt}, lease_until = null
        WHERE id = ${id}
      `;
    },
    async deadLetter(id, error) {
      await sql`
        UPDATE outbox_jobs
        SET state = 'DEAD_LETTER', last_error = ${error}, lease_until = null
        WHERE id = ${id}
      `;
    },
  };
}
