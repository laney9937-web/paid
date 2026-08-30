import {
  AppError,
  assertPositive,
  DELIVERY_DURATIONS,
  generateShareableLinkId,
  money,
  TRANSACTION_CATEGORIES,
  type ActorContext,
  type DeliveryDuration,
  type TransactionCategory,
} from '@paid/contracts';
import { requestHash } from '../hash';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';
import type { LinkRecord } from '../records';

export type CreateLinkInput = {
  actor: ActorContext;
  amountMinor: string;
  category: TransactionCategory;
  deliveryDuration: DeliveryDuration;
  note?: string;
};

export async function createTransactionLink(
  uow: UnitOfWork,
  input: CreateLinkInput,
): Promise<LinkRecord> {
  if (input.actor.actorType !== 'CREATOR' || !input.actor.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  if (!uow.config.newLinksEnabled) {
    throw new AppError('FORBIDDEN', 'New link creation is disabled');
  }
  const creator = await uow.getCreator(input.actor.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  if (creator.onboardingState !== 'ACTIVE' || creator.restricted || creator.newCheckoutBlocked) {
    throw new AppError('FORBIDDEN', 'Creator is not eligible to create links');
  }
  if (!(TRANSACTION_CATEGORIES as readonly string[]).includes(input.category)) {
    throw new AppError('VALIDATION_FAILED', 'Invalid transaction category');
  }
  if (!(DELIVERY_DURATIONS as readonly string[]).includes(input.deliveryDuration)) {
    throw new AppError('VALIDATION_FAILED', 'Invalid delivery duration');
  }
  const amount = money(input.amountMinor);
  assertPositive(amount, 'amount');
  if (
    amount.amountMinor < BigInt(uow.config.policy.minTicketMinor) ||
    amount.amountMinor > BigInt(uow.config.policy.maxTicketMinor)
  ) {
    throw new AppError('LIMIT_EXCEEDED', 'Amount is outside the allowed ticket range');
  }
  if (creator.lane === 'ADULT' && !uow.config.adultLaneEnabled) {
    throw new AppError('FORBIDDEN', 'Adult lane is not enabled');
  }
  const now = uow.clock.now();
  const termsHash = requestHash({
    creatorId: creator.id,
    amount: amount.amountMinor.toString(),
    currency: amount.currency,
    category: input.category,
    deliveryDuration: input.deliveryDuration,
    lane: creator.lane,
    policyVersion: uow.config.policyVersion,
    feeScheduleVersion: uow.config.feeScheduleVersion,
  });
  const link: LinkRecord = {
    id: newId(),
    creatorId: creator.id,
    shareId: generateShareableLinkId(),
    state: 'ACTIVE',
    amount,
    category: input.category,
    deliveryDuration: input.deliveryDuration,
    lane: creator.lane,
    note: input.note?.slice(0, 280) ?? null,
    termsHash,
    activatedAt: now,
    expiresAt: new Date(now.getTime() + uow.config.policy.linkExpiryDays * 86400 * 1000),
    cancelledAt: null,
    version: 1,
    createdAt: now,
  };
  await uow.insertLink(link);
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'LINK_CREATED',
    subjectType: 'transaction_link',
    subjectId: link.id,
    afterDigest: termsHash,
    createdAt: now,
  });
  return link;
}
