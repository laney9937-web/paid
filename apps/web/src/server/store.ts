import { withPostgresUow, type PostgresUnitOfWork } from '@paid/db';
import { createTransactionLink, type UnitOfWork } from '@paid/domain';
import { creatorActor } from '@paid/test-support';

export async function withStore<T>(fn: (uow: PostgresUnitOfWork) => Promise<T>): Promise<T> {
  return withPostgresUow(fn);
}

export async function ensureDemoLink() {
  return withStore(async (uow) => {
    const existing = await uow.listLinksByCreator('creator_maya');
    const active = existing.find((link) => link.state === 'ACTIVE');
    if (active) return active;
    return createTransactionLink(uow, {
      actor: creatorActor(),
      amountMinor: '5000',
      category: 'DIGITAL_COMMISSION',
      deliveryDuration: 'PT48H',
      note: 'Protected digital commission',
    });
  });
}

export type { UnitOfWork };
