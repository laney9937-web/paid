import { describe, expect, it } from 'vitest';
import { createEmailMock } from '@paid/email-mock';
import { createLogger } from '@paid/observability';
import { createPostgresOutboxRuntime, getSql, withPostgresUow } from '@paid/db';
import { processOutbox } from '../apps/worker/src/processor';
import { newId } from '@paid/domain';

describe('postgres outbox worker', () => {
  it('leases a real outbox row, sends once, and acks', async () => {
    const id = newId();
    await withPostgresUow((uow) =>
      uow.insertOutbox({
        id,
        type: 'EMAIL_BUYER_RECEIPT',
        payload: { toDigest: 'recipient_digest' },
        dedupeKey: `email-receipt:${id}`,
        availableAt: uow.clock.now(),
        attemptCount: 0,
        maxAttempts: 3,
        state: 'PENDING',
      }),
    );
    const email = createEmailMock();
    const log = createLogger('test', 'silent');
    for (let i = 0; i < 8; i += 1) {
      await processOutbox(createPostgresOutboxRuntime(), email.adapter, log, 32);
      if (email.sent.some((row) => row.idempotencyKey === `email-receipt:${id}`)) break;
    }
    expect(email.sent.filter((row) => row.idempotencyKey === `email-receipt:${id}`)).toHaveLength(
      1,
    );
    const rows = await getSql()`SELECT state, side_effect_at FROM outbox_jobs WHERE id = ${id}`;
    expect(String((rows[0] as { state: string }).state)).toBe('COMPLETED');
  });
});
