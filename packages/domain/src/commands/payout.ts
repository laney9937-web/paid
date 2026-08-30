import { AppError, money, type ActorContext } from '@paid/contracts';
import { payoutJournal } from '../ledger-postings';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

export async function requestPayout(
  uow: UnitOfWork,
  input: {
    actor: ActorContext;
    creatorId: string;
    amountMinor: string;
    destinationAgeHours: number;
    idempotencyKey: string;
  },
): Promise<{ payoutId: string }> {
  if (!uow.config.payoutEnabled) {
    throw new AppError('FORBIDDEN', 'Payouts are disabled');
  }
  const allowed =
    (input.actor.actorType === 'CREATOR' && input.actor.creatorId === input.creatorId) ||
    (input.actor.actorType === 'OPS' && input.actor.opsRoles?.includes('PAYMENTS'));
  if (!allowed) throw new AppError('FORBIDDEN', 'Not allowed to request payout');
  if (input.actor.authStrength !== 'STEP_UP' && input.actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required for payouts');
  }
  const creator = await uow.getCreator(input.creatorId);
  if (!creator) throw new AppError('NOT_FOUND', 'Creator not found');
  if (creator.payoutHold) throw new AppError('FORBIDDEN', 'Payouts are on hold');
  if (input.destinationAgeHours < uow.config.policy.payoutCooldownHours) {
    throw new AppError('FORBIDDEN', 'Payout destination is in cooldown');
  }
  const amount = money(input.amountMinor);
  if (amount.amountMinor <= 0n) {
    throw new AppError('VALIDATION_FAILED', 'Payout amount must be positive');
  }
  const balances = await uow.projectCreatorBalances(input.creatorId, uow.clock.now());
  if (amount.amountMinor > balances.availableMinor) {
    throw new AppError('VALIDATION_FAILED', 'Payout exceeds available balance');
  }
  const now = uow.clock.now();
  const payoutId = newId();
  await uow.appendJournal(
    payoutJournal({ payoutId, creatorId: input.creatorId, amount, occurredAt: now }),
  );
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'PAYOUT_REQUESTED',
    subjectType: 'payout',
    subjectId: payoutId,
    createdAt: now,
  });
  return { payoutId };
}

export function instantPayoutSupported(): false {
  return false;
}
