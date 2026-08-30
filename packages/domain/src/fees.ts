import { applyBps, money, type Money } from '@paid/contracts';
import { MOCK_POLICY } from '@paid/config';

export function quoteFees(amount: Money, policy = MOCK_POLICY) {
  const platformFee = applyBps(amount, policy.platformTakeRateBps);
  const processorVariable = applyBps(amount, policy.processorEstimateBps);
  const processorFeeEstimate = money(
    processorVariable.amountMinor + BigInt(policy.processorFixedMinor),
    amount.currency,
  );
  const reserveAmount = applyBps(amount, policy.reserveBps);
  const protectionVariable = applyBps(amount, policy.buyerProtectionBps);
  const uncappedProtection =
    protectionVariable.amountMinor + BigInt(policy.buyerProtectionFixedMinor);
  const cap = BigInt(policy.buyerProtectionCapMinor);
  const buyerProtectionFee = money(
    uncappedProtection > cap ? cap : uncappedProtection,
    amount.currency,
  );
  const creatorGross = money(amount.amountMinor - platformFee.amountMinor, amount.currency);
  const totalToday = money(amount.amountMinor + buyerProtectionFee.amountMinor, amount.currency);
  return {
    platformFee,
    processorFeeEstimate,
    reserveAmount,
    buyerProtectionFee,
    creatorGross,
    totalToday,
  };
}
