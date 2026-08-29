import type { PaymentState } from '@paid/contracts';
import { type TransitionTable, transition } from './table';

export const PAYMENT_EVENTS = [
  'AUTH_START',
  'AUTHORIZE',
  'CAPTURE',
  'FAIL',
  'VOID',
  'CANCEL',
  'UNKNOWN',
] as const;
export type PaymentEvent = (typeof PAYMENT_EVENTS)[number];

export const PAYMENT_TRANSITIONS: TransitionTable<PaymentState, PaymentEvent> = {
  CREATED: {
    AUTH_START: 'AUTH_PENDING',
    AUTHORIZE: 'AUTHORIZED',
    CAPTURE: 'CAPTURED',
    FAIL: 'FAILED',
    CANCEL: 'CANCELLED',
    UNKNOWN: 'UNKNOWN_REQUIRES_RECONCILIATION',
  },
  AUTH_PENDING: {
    AUTHORIZE: 'AUTHORIZED',
    CAPTURE: 'CAPTURED',
    FAIL: 'FAILED',
    CANCEL: 'CANCELLED',
    UNKNOWN: 'UNKNOWN_REQUIRES_RECONCILIATION',
  },
  AUTHORIZED: {
    CAPTURE: 'CAPTURED',
    VOID: 'VOIDED',
    FAIL: 'FAILED',
    UNKNOWN: 'UNKNOWN_REQUIRES_RECONCILIATION',
  },
  CAPTURED: {},
  FAILED: {},
  VOIDED: {},
  CANCELLED: {},
  UNKNOWN_REQUIRES_RECONCILIATION: { CAPTURE: 'CAPTURED', FAIL: 'FAILED', VOID: 'VOIDED' },
};

export function transitionPayment(from: PaymentState, event: PaymentEvent): PaymentState {
  return transition(PAYMENT_TRANSITIONS, from, event, 'payment');
}
