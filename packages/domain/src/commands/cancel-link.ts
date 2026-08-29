import { AppError, type ActorContext } from '@paid/contracts';
import { transitionLink } from '../machines/link';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';
import type { LinkRecord } from '../records';

export async function cancelTransactionLink(
  uow: UnitOfWork,
  input: { actor: ActorContext; linkId: string },
): Promise<LinkRecord> {
  if (input.actor.actorType !== 'CREATOR' || !input.actor.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  const link = await uow.lockLink(input.linkId);
  if (!link || link.creatorId !== input.actor.creatorId) {
    throw new AppError('NOT_FOUND', 'Link not found');
  }
  const next = transitionLink(link.state, 'CANCEL');
  const now = uow.clock.now();
  const updated = { ...link, state: next, cancelledAt: now, version: link.version + 1 };
  await uow.updateLink(updated);
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'LINK_CANCELLED',
    subjectType: 'transaction_link',
    subjectId: link.id,
    createdAt: now,
  });
  return updated;
}

export async function expireTransactionLink(
  uow: UnitOfWork,
  linkId: string,
): Promise<LinkRecord | null> {
  const link = await uow.lockLink(linkId);
  if (!link) return null;
  const now = uow.clock.now();
  if (!link.expiresAt || link.expiresAt > now) return link;
  if (link.state !== 'ACTIVE') return link;
  const reservation = await uow.findNonterminalReservation(link.id);
  if (reservation) return link;
  const updated = {
    ...link,
    state: transitionLink(link.state, 'EXPIRE'),
    version: link.version + 1,
  };
  await uow.updateLink(updated);
  await uow.insertAudit({
    id: newId(),
    actor: { actorType: 'WORKER', authStrength: 'SERVICE', requestId: 'expire' },
    action: 'LINK_EXPIRED',
    subjectType: 'transaction_link',
    subjectId: link.id,
    createdAt: now,
  });
  return updated;
}
