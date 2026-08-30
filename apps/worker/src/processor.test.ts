import { describe, expect, it } from 'vitest';
import { MemoryUnitOfWork } from '@paid/test-support';
import { createEmailMock } from '@paid/email-mock';
import { createLogger } from '@paid/observability';
import { processOutbox } from './processor';

describe('outbox worker', () => {
  it('J-01/J-02/J-08 processes a job once and is idempotent on retry', async () => {
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

  it('J-02 crash after side effect before ack does not duplicate email', async () => {
    const uow = new MemoryUnitOfWork();
    await uow.insertOutbox({
      id: 'job-crash',
      type: 'EMAIL_BUYER_RECEIPT',
      payload: { transactionId: 't-crash' },
      dedupeKey: 'email-receipt:t-crash',
      availableAt: uow.clock.now(),
      attemptCount: 1,
      maxAttempts: 3,
      state: 'PENDING',
    });
    const email = createEmailMock();
    await email.adapter.send({
      toDigest: 'recipient_digest',
      templateId: 'EMAIL_BUYER_RECEIPT',
      templateVersion: 'v1',
      variables: { kind: 'EMAIL_BUYER_RECEIPT' },
    });
    const log = createLogger('test', 'silent');
    await processOutbox(uow, email.adapter, log);
    expect(email.sent).toHaveLength(1);
  });

  it('J-03 retry uses bounded backoff', async () => {
    const uow = new MemoryUnitOfWork();
    await uow.insertOutbox({
      id: 'job-retry',
      type: 'EMAIL_BUYER_RECEIPT',
      payload: { transactionId: 't-retry' },
      dedupeKey: 'email-retry:t',
      availableAt: uow.clock.now(),
      attemptCount: 0,
      maxAttempts: 5,
      state: 'PENDING',
    });
    const failing = {
      name: 'failing-email',
      send: async () => {
        throw new Error('smtp-timeout');
      },
    };
    const log = createLogger('test', 'silent');
    const n = await processOutbox(uow, failing, log);
    expect(n).toBe(0);
    const job = uow.outbox[0]!;
    expect(job.state).toBe('PENDING');
    expect(job.attemptCount).toBe(1);
    expect(job.availableAt.getTime()).toBeGreaterThan(uow.clock.now().getTime());
  });

  it('J-04 dead-letter after max attempts', async () => {
    const uow = new MemoryUnitOfWork();
    await uow.insertOutbox({
      id: 'job-dead',
      type: 'EMAIL_BUYER_RECEIPT',
      payload: { transactionId: 't-dead' },
      dedupeKey: 'email-dead:t',
      availableAt: uow.clock.now(),
      attemptCount: 0,
      maxAttempts: 1,
      state: 'PENDING',
    });
    const failing = {
      name: 'failing-email',
      send: async () => {
        throw new Error('smtp-down');
      },
    };
    const log = createLogger('test', 'silent');
    await processOutbox(uow, failing, log);
    expect(uow.outbox[0]!.state).toBe('DEAD_LETTER');
  });
});
