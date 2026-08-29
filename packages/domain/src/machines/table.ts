import { AppError } from '@paid/contracts';

export type TransitionTable<S extends string, E extends string> = Readonly<
  Record<S, Readonly<Partial<Record<E, S>>>>
>;

export function transition<S extends string, E extends string>(
  table: TransitionTable<S, E>,
  from: S,
  event: E,
  label: string,
): S {
  const next = table[from]?.[event];
  if (!next) {
    throw new AppError('STATE_CONFLICT', `Invalid ${label} transition ${from} + ${event}`);
  }
  return next;
}

export function canTransition<S extends string, E extends string>(
  table: TransitionTable<S, E>,
  from: S,
  event: E,
): boolean {
  return Boolean(table[from]?.[event]);
}
