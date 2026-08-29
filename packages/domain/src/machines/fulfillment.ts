import type { FulfillmentState } from '@paid/contracts';
import { type TransitionTable, transition } from './table';

export const FULFILLMENT_EVENTS = ['MARK_DELIVERED', 'BUYER_ACCEPT', 'DISPUTE'] as const;
export type FulfillmentEvent = (typeof FULFILLMENT_EVENTS)[number];

export const FULFILLMENT_TRANSITIONS: TransitionTable<FulfillmentState, FulfillmentEvent> = {
  AWAITING_DELIVERY: { MARK_DELIVERED: 'CREATOR_MARKED_DELIVERED', DISPUTE: 'DISPUTED' },
  CREATOR_MARKED_DELIVERED: { BUYER_ACCEPT: 'BUYER_ACCEPTED', DISPUTE: 'DISPUTED' },
  BUYER_ACCEPTED: { DISPUTE: 'DISPUTED' },
  DISPUTED: {},
};

export function transitionFulfillment(
  from: FulfillmentState,
  event: FulfillmentEvent,
): FulfillmentState {
  return transition(FULFILLMENT_TRANSITIONS, from, event, 'fulfillment');
}
