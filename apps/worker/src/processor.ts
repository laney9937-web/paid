import type { EmailProviderAdapter } from '@paid/email-core';
import type { MemoryUnitOfWork } from '@paid/test-support';
import type { Logger } from 'pino';

export async function processOutbox(
  uow: MemoryUnitOfWork,
  email: EmailProviderAdapter,
  log: Logger,
): Promise<number> {
  let processed = 0;
  for (const job of uow.outbox) {
    if (job.state !== 'PENDING') continue;
    if (job.availableAt > uow.clock.now()) continue;
    job.state = 'LEASED';
    job.attemptCount += 1;
    try {
      if (job.type.startsWith('EMAIL_')) {
        await email.send({
          toDigest: 'recipient_digest',
          templateId: job.type,
          templateVersion: 'v1',
          variables: { kind: job.type },
        });
      }
      job.state = 'COMPLETED';
      processed += 1;
    } catch (error) {
      job.lastError = error instanceof Error ? error.message : 'error';
      if (job.attemptCount >= job.maxAttempts) {
        job.state = 'DEAD_LETTER';
        log.warn({ jobId: job.id, type: job.type }, 'dead letter');
      } else {
        job.state = 'PENDING';
        job.availableAt = new Date(uow.clock.now().getTime() + 2 ** job.attemptCount * 1000);
      }
    }
  }
  return processed;
}
