import { describe, expect, it } from 'vitest';
import { MemoryUnitOfWork } from '@paid/test-support';
import { createEmailMock } from '@paid/email-mock';
import { createLogger } from '@paid/observability';
import { processOutbox } from './processor';

describe('outbox worker', () => {
  it('processes a job once and is idempotent on retry', async () => {
    const uow = new MemoryUnitOfWork();
    await uow.insertOutbox({
      id: 'job1',
      type: 'EMAIL_BUYER_RECEIPT',
      payload: { transactionId: 't1' },
      dedupeKey: 'email-receipt:t1',
      availableAt: uow.clock.now(),
      attemptCount: 0,
      maxAttempts: 3,
      state: 'PENDING',
    });
    const email = createEmailMock();
    const log = createLogger('test', 'silent');
    const first = await processOutbox(uow, email.adapter, log);
    const second = await processOutbox(uow, email.adapter, log);
    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(email.sent).toHaveLength(1);
  });
});
