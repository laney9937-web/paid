import { FakeClock } from '@paid/contracts';
import { createTransactionLink } from '@paid/domain';
import { MemoryUnitOfWork, creatorActor, seedCreator } from '@paid/test-support';

const g = globalThis as unknown as { __paidStore?: MemoryUnitOfWork };

export function getStore(): MemoryUnitOfWork {
  if (!g.__paidStore) {
    const clock = new FakeClock();
    const uow = new MemoryUnitOfWork({
      clock,
      creator: seedCreator({
        memberSince: new Date('2026-01-15T00:00:00.000Z'),
      }),
    });
    g.__paidStore = uow;
  }
  return g.__paidStore;
}

export async function ensureDemoLink() {
  const uow = getStore();
  const existing = await uow.listLinksByCreator('creator_maya');
  if (existing.length > 0) return existing[0]!;
  return createTransactionLink(uow, {
    actor: creatorActor(),
    amountMinor: '5000',
    category: 'DIGITAL_COMMISSION',
    deliveryDuration: 'PT48H',
    note: 'Protected digital commission',
  });
}
