import type { ReservationState } from '@paid/contracts';
import { type TransitionTable, transition } from './table';

export const RESERVATION_EVENTS = [
  'PROVIDER_CREATED',
  'CAPTURE',
  'FAIL',
  'HOLD',
  'RELEASE_EXPIRED',
] as const;
export type ReservationEvent = (typeof RESERVATION_EVENTS)[number];

export const RESERVATION_TRANSITIONS: TransitionTable<ReservationState, ReservationEvent> = {
  RESERVED: {
    PROVIDER_CREATED: 'PROVIDER_CREATED',
    HOLD: 'RECONCILIATION_HOLD',
    FAIL: 'FAILED',
    CAPTURE: 'CAPTURED',
    RELEASE_EXPIRED: 'EXPIRED_RELEASED',
  },
  PROVIDER_CREATED: {
    CAPTURE: 'CAPTURED',
    HOLD: 'RECONCILIATION_HOLD',
    FAIL: 'FAILED',
    RELEASE_EXPIRED: 'EXPIRED_RELEASED',
  },
  RECONCILIATION_HOLD: {
    CAPTURE: 'CAPTURED',
    FAIL: 'FAILED',
    RELEASE_EXPIRED: 'EXPIRED_RELEASED',
  },
  CAPTURED: {},
  FAILED: {},
  EXPIRED_RELEASED: { CAPTURE: 'CAPTURED' },
};

export function transitionReservation(
  from: ReservationState,
  event: ReservationEvent,
): ReservationState {
  return transition(RESERVATION_TRANSITIONS, from, event, 'reservation');
}

export const NONTERMINAL_RESERVATIONS: ReadonlySet<ReservationState> = new Set([
  'RESERVED',
  'PROVIDER_CREATED',
  'RECONCILIATION_HOLD',
]);
