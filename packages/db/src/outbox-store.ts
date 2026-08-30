import type { OutboxRecord } from '@paid/domain';
import { openSecret, recoverPendingProviderEvents } from '@paid/domain';
import { postgresDomainConfig } from './domain-config';
import { getSql } from './client';
import { withPostgresUow } from './postgres-uow';

export type RuntimeJob = OutboxRecord & { sideEffectAt?: Date | null };

export interface OutboxRuntime {
  now(): Date;
  leaseDueJobs(limit: number): Promise<RuntimeJob[]>;
  markSideEffect(id: string, at: Date): Promise<void>;
  ack(id: string): Promise<void>;
  retry(id: string, error: string, availableAt: Date): Promise<void>;
  deadLetter(id: string, error: string): Promise<void>;
  resolveSecret?(envelopeId: string): Promise<string | null>;
  purgeSecret?(envelopeId: string): Promise<void>;
  recoverProviderInbox?(): Promise<number>;
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
    async recoverProviderInbox() {
      const recovered = await withPostgresUow((uow) =>
        recoverPendingProviderEvents(uow, uow.inbox),
      );
      return recovered.filter((row) => row.outcome === 'APPLIED').length;
    },
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
    async resolveSecret(envelopeId) {
      const rows = await sql`
        SELECT ciphertext, nonce, auth_tag, key_version, consumed_at, expires_at
        FROM secret_envelopes WHERE id = ${envelopeId}
      `;
      const row = rows[0] as Record<string, unknown> | undefined;
      if (!row || row.consumed_at || !row.ciphertext || !row.auth_tag) return null;
      if (new Date(String(row.expires_at)) <= new Date()) return null;
      const asBuffer = (value: unknown) =>
        Buffer.isBuffer(value) ? value : Buffer.from(value as Uint8Array);
      return openSecret(
        {
          ciphertext: asBuffer(row.ciphertext),
          nonce: asBuffer(row.nonce),
          authTag: asBuffer(row.auth_tag),
          keyVersion: String(row.key_version),
        },
        postgresDomainConfig().restrictedFieldKeyring,
      );
    },
    async purgeSecret(envelopeId) {
      await sql`
        UPDATE secret_envelopes
        SET ciphertext = null, auth_tag = null, consumed_at = ${new Date()}
        WHERE id = ${envelopeId}
      `;
    },
  };
}
