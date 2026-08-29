import { MemoryUnitOfWork } from '@paid/test-support';

const g = globalThis as unknown as { __paidWorkerStore?: MemoryUnitOfWork };

export function getWorkerStore(): MemoryUnitOfWork {
  if (!g.__paidWorkerStore) {
    g.__paidWorkerStore = new MemoryUnitOfWork();
  }
  return g.__paidWorkerStore;
}
