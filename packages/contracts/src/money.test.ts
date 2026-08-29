import { describe, expect, it } from 'vitest';
import * as fc from 'fast-check';
import { add, formatUsd, money, subtract, toWire } from './money';

describe('money properties', () => {
  it('add then subtract returns the original for integer minor units', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: -1000000n, max: 1000000n }),
        fc.bigInt({ min: 0n, max: 1000000n }),
        (a, b) => {
          const left = money(a);
          const right = money(b);
          const roundTrip = subtract(add(left, right), right);
          expect(roundTrip.amountMinor).toBe(a);
          expect(roundTrip.currency).toBe('USD');
        },
      ),
    );
  });

  it('wire format never uses floats', () => {
    const wired = toWire(money(199n));
    expect(wired.amountMinor).toBe('199');
    expect(wired.currency).toBe('USD');
    expect(formatUsd(money(199n))).toBe('$1.99');
  });
});
