import { AppError, type Money } from '@paid/contracts';
import { newId } from './uuid';
import type { LedgerEntryInput, LedgerLineInput, SnapshotRecord } from './records';

export const ACCOUNT = {
  PROCESSOR_CLEARING: 'processor.settlement_clearing',
  CREATOR_PAYABLE: 'creator.payable',
  CREATOR_RESERVE: 'creator.reserve_liability',
  PLATFORM_FEE_REVENUE: 'platform.fee_revenue',
  PROCESSOR_FEE_EXPENSE: 'processor.fee_expense',
  REFUND_CLEARING: 'refund.clearing',
  DISPUTE_CLEARING: 'network_dispute.clearing',
  CHARGEBACK_RECEIVABLE: 'creator.chargeback_receivable',
  PAYOUT_CLEARING: 'payout.clearing',
  PAYOUT_IN_TRANSIT: 'payout.in_transit',
  ADJUSTMENT_SUSPENSE: 'manual.adjustment_suspense',
} as const;

function balanced(lines: LedgerLineInput[], currency: Money['currency']): void {
  let debit = 0n;
  let credit = 0n;
  for (const line of lines) {
    if (line.amount.currency !== currency) {
      throw new AppError('INTERNAL_ERROR', 'Ledger line currency mismatch');
    }
    if (line.amount.amountMinor <= 0n) {
      throw new AppError('INTERNAL_ERROR', 'Ledger line amount must be positive');
    }
    if (line.direction === 'DEBIT') debit += line.amount.amountMinor;
    else credit += line.amount.amountMinor;
  }
  if (debit !== credit) {
    throw new AppError('INTERNAL_ERROR', `Unbalanced journal debit=${debit} credit=${credit}`);
  }
}

export function captureJournal(params: {
  transactionId: string;
  snapshot: SnapshotRecord;
  occurredAt: Date;
}): LedgerEntryInput {
  const { snapshot } = params;
  const creatorNet = {
    amountMinor:
      snapshot.amount.amountMinor -
      snapshot.platformFee.amountMinor -
      snapshot.reserveAmount.amountMinor,
    currency: snapshot.amount.currency,
  };
  const lines: LedgerLineInput[] = [
    { accountCode: ACCOUNT.PROCESSOR_CLEARING, direction: 'DEBIT', amount: snapshot.amount },
    {
      accountCode: ACCOUNT.CREATOR_PAYABLE,
      direction: 'CREDIT',
      amount: creatorNet,
      creatorId: snapshot.creatorId,
    },
    {
      accountCode: ACCOUNT.CREATOR_RESERVE,
      direction: 'CREDIT',
      amount: snapshot.reserveAmount,
      creatorId: snapshot.creatorId,
    },
    {
      accountCode: ACCOUNT.PLATFORM_FEE_REVENUE,
      direction: 'CREDIT',
      amount: snapshot.platformFee,
    },
  ];
  balanced(lines, snapshot.amount.currency);
  return {
    id: newId(),
    sourceType: 'PAYMENT_CAPTURED',
    sourceId: params.transactionId,
    transactionId: params.transactionId,
    currency: snapshot.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function refundJournal(params: {
  transactionId: string;
  refundId: string;
  snapshot: SnapshotRecord;
  refundAmount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const { snapshot, refundAmount } = params;
  const fullRefund = refundAmount.amountMinor === snapshot.amount.amountMinor;
  const platformShare = {
    amountMinor: fullRefund
      ? snapshot.platformFee.amountMinor
      : (refundAmount.amountMinor * snapshot.platformFee.amountMinor) / snapshot.amount.amountMinor,
    currency: refundAmount.currency,
  };
  const reserveShare = {
    amountMinor: fullRefund
      ? snapshot.reserveAmount.amountMinor
      : (refundAmount.amountMinor * snapshot.reserveAmount.amountMinor) /
        snapshot.amount.amountMinor,
    currency: refundAmount.currency,
  };
  const creatorShare = {
    amountMinor: refundAmount.amountMinor - platformShare.amountMinor - reserveShare.amountMinor,
    currency: refundAmount.currency,
  };
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.CREATOR_PAYABLE,
      direction: 'DEBIT',
      amount: creatorShare,
      creatorId: snapshot.creatorId,
    },
    {
      accountCode: ACCOUNT.CREATOR_RESERVE,
      direction: 'DEBIT',
      amount: reserveShare,
      creatorId: snapshot.creatorId,
    },
    { accountCode: ACCOUNT.PLATFORM_FEE_REVENUE, direction: 'DEBIT', amount: platformShare },
    { accountCode: ACCOUNT.PROCESSOR_CLEARING, direction: 'CREDIT', amount: refundAmount },
  ];
  balanced(lines, refundAmount.currency);
  return {
    id: newId(),
    sourceType: 'REFUND_SUCCEEDED',
    sourceId: params.refundId,
    transactionId: params.transactionId,
    currency: refundAmount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function payoutReserveJournal(params: {
  payoutId: string;
  creatorId: string;
  amount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.CREATOR_PAYABLE,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    {
      accountCode: ACCOUNT.PAYOUT_IN_TRANSIT,
      direction: 'CREDIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'PAYOUT_RESERVED',
    sourceId: params.payoutId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function payoutJournal(params: {
  payoutId: string;
  creatorId: string;
  amount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.PAYOUT_IN_TRANSIT,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    {
      accountCode: ACCOUNT.PAYOUT_CLEARING,
      direction: 'CREDIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'PAYOUT_PAID',
    sourceId: params.payoutId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function payoutFailedJournal(params: {
  payoutId: string;
  creatorId: string;
  amount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.PAYOUT_IN_TRANSIT,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    {
      accountCode: ACCOUNT.CREATOR_PAYABLE,
      direction: 'CREDIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'PAYOUT_FAILED',
    sourceId: params.payoutId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function chargebackAfterPayoutJournal(params: {
  transactionId: string;
  creatorId: string;
  amount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.CHARGEBACK_RECEIVABLE,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    { accountCode: ACCOUNT.DISPUTE_CLEARING, direction: 'CREDIT', amount: params.amount },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'CHARGEBACK_AFTER_PAYOUT',
    sourceId: params.transactionId,
    transactionId: params.transactionId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function reserveReleaseJournal(params: {
  transactionId: string;
  creatorId: string;
  amount: Money;
  occurredAt: Date;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: ACCOUNT.CREATOR_RESERVE,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    {
      accountCode: ACCOUNT.CREATOR_PAYABLE,
      direction: 'CREDIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'RESERVE_RELEASE',
    sourceId: params.transactionId,
    transactionId: params.transactionId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}

export function manualAdjustmentJournal(params: {
  adjustmentId: string;
  debitAccount: string;
  creditAccount: string;
  amount: Money;
  occurredAt: Date;
  creatorId?: string;
}): LedgerEntryInput {
  const lines: LedgerLineInput[] = [
    {
      accountCode: params.debitAccount,
      direction: 'DEBIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
    {
      accountCode: params.creditAccount,
      direction: 'CREDIT',
      amount: params.amount,
      creatorId: params.creatorId,
    },
  ];
  balanced(lines, params.amount.currency);
  return {
    id: newId(),
    sourceType: 'MANUAL_ADJUSTMENT',
    sourceId: params.adjustmentId,
    currency: params.amount.currency,
    accountingRuleVersion: 'ledger.v1',
    occurredAt: params.occurredAt,
    lines,
  };
}
