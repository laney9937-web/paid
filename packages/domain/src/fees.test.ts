import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { money } from '@paid/contracts';
import { MOCK_POLICY } from '@paid/config';
import { quoteFees } from './fees';

describe('quoteFees MOCK v2', () => {
  it('caps buyer protection at $4.99 and never goes negative', () => {
    const small = quoteFees(money('2000'), MOCK_POLICY);
    expect(small.buyerProtectionFee.amountMinor).toBe((2000n * 390n) / 10_000n + 49n);
    const large = quoteFees(money('500000'), MOCK_POLICY);
    expect(large.buyerProtectionFee.amountMinor).toBe(499n);
    expect(small.buyerProtectionFee.amountMinor >= 0n).toBe(true);
    expect(large.totalToday.amountMinor).toBe(500000n + 499n);
  });

  it('replays the same fee version for the same amount', () => {
    const first = quoteFees(money('3500'), MOCK_POLICY);
    const second = quoteFees(money('3500'), MOCK_POLICY);
    expect(first).toEqual(second);
    expect(MOCK_POLICY.feeScheduleVersion).toBe('fee.v2.mock');
  });

  it('property: protection is min(uncapped, cap) and totals match', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2000, max: 500_000 }), (minor) => {
        const amount = money(String(minor));
        const quoted = quoteFees(amount, MOCK_POLICY);
        const uncapped = (BigInt(minor) * 390n) / 10_000n + 49n;
        const expected = uncapped > 499n ? 499n : uncapped;
        expect(quoted.buyerProtectionFee.amountMinor).toBe(expected);
        expect(quoted.totalToday.amountMinor).toBe(BigInt(minor) + expected);
        expect(quoted.platformFee.amountMinor).toBe((BigInt(minor) * 500n) / 10_000n);
        expect(quoted.buyerProtectionFee.amountMinor >= 0n).toBe(true);
      }),
      { numRuns: 50 },
    );
  });
});
