import { withPostgresUow, type PostgresUnitOfWork } from '@paid/db';
import type { UnitOfWork } from '@paid/domain';

export async function withStore<T>(fn: (uow: PostgresUnitOfWork) => Promise<T>): Promise<T> {
  return withPostgresUow(fn);
}

export type { UnitOfWork };
