import type { LinkState } from '@paid/contracts';
import { type TransitionTable, transition } from './table';

export const LINK_EVENTS = ['ACTIVATE', 'USE', 'EXPIRE', 'CANCEL', 'DISABLE'] as const;
export type LinkEvent = (typeof LINK_EVENTS)[number];

export const LINK_TRANSITIONS: TransitionTable<LinkState, LinkEvent> = {
  DRAFT: { ACTIVATE: 'ACTIVE', CANCEL: 'CANCELLED', DISABLE: 'DISABLED' },
  ACTIVE: { USE: 'USED', EXPIRE: 'EXPIRED', CANCEL: 'CANCELLED', DISABLE: 'DISABLED' },
  USED: {},
  EXPIRED: {},
  CANCELLED: { DISABLE: 'DISABLED' },
  DISABLED: {},
};

export function transitionLink(from: LinkState, event: LinkEvent): LinkState {
  return transition(LINK_TRANSITIONS, from, event, 'link');
}

export const LINK_TERMINAL: ReadonlySet<LinkState> = new Set([
  'USED',
  'EXPIRED',
  'CANCELLED',
  'DISABLED',
]);
