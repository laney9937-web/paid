import { AppError, money, type ActorContext } from '@paid/contracts';
import { ACCOUNT, manualAdjustmentJournal } from '../ledger-postings';
import { newId } from '../uuid';
import type { UnitOfWork } from '../ports';

const DUAL_CONTROL_THRESHOLD_MINOR = 10_000n;

export async function applyManualAdjustment(
  uow: UnitOfWork,
  input: {
    actor: ActorContext;
    amountMinor: string;
    reason: string;
    debitAccount?: string;
    creditAccount?: string;
    creatorId?: string;
    secondApprover?: ActorContext;
  },
): Promise<{ adjustmentId: string }> {
  const payments = input.actor.actorType === 'OPS' && input.actor.opsRoles?.includes('PAYMENTS');
  if (!payments) throw new AppError('FORBIDDEN', 'Manual adjustments require payments operators');
  if (input.actor.authStrength !== 'STEP_UP' && input.actor.authStrength !== 'PASSKEY') {
    throw new AppError('STEP_UP_REQUIRED', 'Fresh authentication is required for adjustments');
  }
  const reason = input.reason.trim();
  if (reason.length < 8) {
    throw new AppError('VALIDATION_FAILED', 'Adjustment reason is required');
  }
  const amount = money(input.amountMinor);
  if (amount.amountMinor <= 0n) {
    throw new AppError('VALIDATION_FAILED', 'Adjustment amount must be positive');
  }
  if (amount.amountMinor >= DUAL_CONTROL_THRESHOLD_MINOR) {
    const second = input.secondApprover;
    const secondOk =
      second &&
      second.actorType === 'OPS' &&
      second.opsRoles?.includes('PAYMENTS') &&
      second.actorId &&
      second.actorId !== input.actor.actorId &&
      (second.authStrength === 'STEP_UP' || second.authStrength === 'PASSKEY');
    if (!secondOk) {
      throw new AppError('FORBIDDEN', 'Dual control is required for this adjustment');
    }
  }
  const now = uow.clock.now();
  const adjustmentId = newId();
  await uow.appendJournal(
    manualAdjustmentJournal({
      adjustmentId,
      debitAccount: input.debitAccount ?? ACCOUNT.ADJUSTMENT_SUSPENSE,
      creditAccount: input.creditAccount ?? ACCOUNT.CREATOR_PAYABLE,
      amount,
      occurredAt: now,
      creatorId: input.creatorId,
    }),
  );
  await uow.insertAudit({
    id: newId(),
    actor: input.actor,
    action: 'MANUAL_ADJUSTMENT',
    subjectType: 'adjustment',
    subjectId: adjustmentId,
    reason,
    createdAt: now,
  });
  return { adjustmentId };
}
