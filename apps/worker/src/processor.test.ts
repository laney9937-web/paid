import { describe, expect, it } from 'vitest';
import { MemoryUnitOfWork } from '@paid/test-support';
import { createEmailMock } from '@paid/email-mock';
import { createLogger } from '@paid/observability';
import { processOutbox } from './processor';
import { createMemoryOutboxRuntime } from './memory-runtime';

function pendingJob(uow: MemoryUnitOfWork, id: string) {
  return uow.insertOutbox({
    id,
    type: 'EMAIL_BUYER_RECEIPT',
    payload: { transactionId: id, toDigest: 'recipient_digest' },
    dedupeKey: `email-receipt:${id}`,
    availableAt: uow.clock.now(),
    attemptCount: 0,
    maxAttempts: 3,
    state: 'PENDING',
  });
}

describe('outbox worker', () => {
  it('J-01/J-08 processes a job once and is idempotent on retry', async () => {
    const uow = new MemoryUnitOfWork();
    await pendingJob(uow, 'job1');
    const email = createEmailMock();
    const log = createLogger('test', 'silent');
    const runtime = createMemoryOutboxRuntime(uow);
    const first = await processOutbox(runtime, email.adapter, log);
    const second = await processOutbox(runtime, email.adapter, log);
    expect(first).toBe(1);
    expect(second).toBe(0);
    expect(email.sent).toHaveLength(1);
  });

  it('J-02 crash after side effect before ack does not duplicate send', async () => {
    const uow = new MemoryUnitOfWork();
    await pendingJob(uow, 'job-crash');
    const email = createEmailMock();
    const log = createLogger('test', 'silent');
    let crash = true;
    const runtime = createMemoryOutboxRuntime(uow, {
      beforeAck: () => {
        if (crash) {
          crash = false;
          throw new Error('crash-before-ack');
        }
      },
    });
    await processOutbox(runtime, email.adapter, log);
    await processOutbox(runtime, email.adapter, log);
    expect(email.sent).toHaveLength(1);
    expect(uow.outbox[0]?.sideEffectAt).toBeTruthy();
    expect(uow.outbox[0]?.state).toBe('COMPLETED');
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
    const n = await processOutbox(createMemoryOutboxRuntime(uow), failing, log);
    expect(n).toBe(0);
    const job = uow.outbox[0]!;
    expect(job.state).toBe('PENDING');
    expect(job.attemptCount).toBe(1);
    expect(job.availableAt.getTime()).toBeGreaterThan(uow.clock.now().getTime());
  });

  it('EMAIL_MAGIC_LINK copies continueUrl into email variables', async () => {
    const uow = new MemoryUnitOfWork();
    await uow.insertOutbox({
      id: 'job-magic',
      type: 'EMAIL_MAGIC_LINK',
      payload: {
        toDigest: 'recipient_digest',
        continueUrl: 'http://127.0.0.1:3000/creator/sign-in/continue?token=one-time-secret',
      },
      dedupeKey: 'email-magic:t',
      availableAt: uow.clock.now(),
      attemptCount: 0,
      maxAttempts: 3,
      state: 'PENDING',
    });
    const email = createEmailMock();
    const log = createLogger('test', 'silent');
    await processOutbox(createMemoryOutboxRuntime(uow), email.adapter, log);
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0]?.variables.continueUrl).toContain('token=one-time-secret');
    expect(email.sent[0]?.templateId).toBe('EMAIL_MAGIC_LINK');
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
    await processOutbox(createMemoryOutboxRuntime(uow), failing, log);
    expect(uow.outbox[0]!.state).toBe('DEAD_LETTER');
  });
});
