import type { EmailProviderAdapter } from '@paid/email-core';
import type { OutboxRuntime, RuntimeJob } from '@paid/db';
import type { Logger } from 'pino';

export async function processOutbox(
  runtime: OutboxRuntime,
  email: EmailProviderAdapter,
  log: Logger,
  limit = 16,
): Promise<number> {
  let processed = 0;
  for (;;) {
    const jobs = await runtime.leaseDueJobs(limit);
    if (jobs.length === 0) break;
    for (const job of jobs) {
      try {
        await performJob(runtime, email, job);
        await runtime.ack(job.id);
        processed += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'error';
        if (job.attemptCount >= job.maxAttempts && !job.sideEffectAt) {
          await runtime.deadLetter(job.id, message);
          log.warn({ jobId: job.id, type: job.type }, 'dead letter');
        } else {
          const delay = job.sideEffectAt ? 0 : 2 ** job.attemptCount * 1000;
          await runtime.retry(job.id, message, new Date(runtime.now().getTime() + delay));
        }
      }
    }
    if (jobs.length < limit) break;
  }
  return processed;
}

async function performJob(
  runtime: OutboxRuntime,
  email: EmailProviderAdapter,
  job: RuntimeJob,
): Promise<void> {
  if (job.sideEffectAt) return;
  if (job.type.startsWith('EMAIL_')) {
    const payload =
      typeof job.payload === 'object' && job.payload
        ? (job.payload as Record<string, unknown>)
        : {};
    const variables: Record<string, string> = { kind: job.type };
    if (typeof payload.continueUrl === 'string' && payload.continueUrl.length > 0) {
      variables.continueUrl = payload.continueUrl;
    }
    await email.send({
      toDigest: typeof payload.toDigest === 'string' ? payload.toDigest : 'recipient_digest',
      templateId: job.type,
      templateVersion: 'v1',
      idempotencyKey: job.dedupeKey,
      variables,
    });
  }
  await runtime.markSideEffect(job.id, runtime.now());
}
