import type { OutboxRuntime, RuntimeJob } from '@paid/db';
import type { MemoryUnitOfWork } from '@paid/test-support';

export function createMemoryOutboxRuntime(
  uow: MemoryUnitOfWork,
  hooks?: { beforeAck?: () => void },
): OutboxRuntime {
  return {
    now: () => uow.clock.now(),
    async leaseDueJobs(limit: number) {
      const now = uow.clock.now();
      const due = uow.outbox.filter(
        (job) => (job.state === 'PENDING' || job.state === 'LEASED') && job.availableAt <= now,
      );
      const selected = due.slice(0, limit);
      for (const job of selected) {
        job.state = 'LEASED';
        job.attemptCount += 1;
      }
      return selected as RuntimeJob[];
    },
    async markSideEffect(id, at) {
      const job = uow.outbox.find((row) => row.id === id);
      if (job) job.sideEffectAt = at;
    },
    async ack(id) {
      hooks?.beforeAck?.();
      const job = uow.outbox.find((row) => row.id === id);
      if (job) job.state = 'COMPLETED';
    },
    async retry(id, error, availableAt) {
      const job = uow.outbox.find((row) => row.id === id);
      if (!job) return;
      job.state = 'PENDING';
      job.lastError = error;
      job.availableAt = availableAt;
    },
    async deadLetter(id, error) {
      const job = uow.outbox.find((row) => row.id === id);
      if (!job) return;
      job.state = 'DEAD_LETTER';
      job.lastError = error;
    },
  };
}
