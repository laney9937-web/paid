import { z } from 'zod';

export const USD = 'USD' as const;
export type Currency = typeof USD;
export const SUPPORTED_CURRENCIES: ReadonlySet<string> = new Set([USD]);

export type Money = Readonly<{ amountMinor: bigint; currency: Currency }>;
export type MoneyWire = Readonly<{ amountMinor: string; currency: Currency }>;

const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;

export class MoneyError extends Error {
  readonly code = 'VALIDATION_FAILED';
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

function assertInt64(value: bigint, label: string): void {
  if (value < INT64_MIN || value > INT64_MAX) {
    throw new MoneyError(`${label} overflows signed 64-bit minor units`);
  }
}

function parseMinor(value: bigint | string | number, label: string): bigint {
  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      throw new MoneyError(
        `${label} must be an integer minor-unit amount; floating-point money is forbidden`,
      );
    }
    if (!Number.isSafeInteger(value)) {
      throw new MoneyError(`${label} exceeds JavaScript safe integer; use a string or bigint`);
    }
    const asBig = BigInt(value);
    assertInt64(asBig, label);
    return asBig;
  }
  if (typeof value === 'string') {
    if (!/^-?\d+$/.test(value)) {
      throw new MoneyError(`${label} must be a base-10 integer string`);
    }
    const asBig = BigInt(value);
    assertInt64(asBig, label);
    return asBig;
  }
  if (typeof value === 'bigint') {
    assertInt64(value, label);
    return value;
  }
  throw new MoneyError(`${label} is not a valid minor-unit amount`);
}

export function assertCurrency(currency: string): asserts currency is Currency {
  if (!SUPPORTED_CURRENCIES.has(currency)) {
    throw new MoneyError(`Unsupported currency '${currency}'; V1 allows USD only`);
  }
}

export function money(amountMinor: bigint | string | number, currency: string = USD): Money {
  assertCurrency(currency);
  return { amountMinor: parseMinor(amountMinor, 'amountMinor'), currency };
}

export function zeroMoney(currency: Currency = USD): Money {
  return { amountMinor: 0n, currency };
}

export function toWire(value: Money): MoneyWire {
  return { amountMinor: value.amountMinor.toString(), currency: value.currency };
}

export function fromWire(
  value: MoneyWire | { amountMinor: string | number | bigint; currency: string },
): Money {
  return money(value.amountMinor, value.currency);
}

export function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Cannot mix currencies ${a.currency} and ${b.currency}`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const sum = a.amountMinor + b.amountMinor;
  assertInt64(sum, 'sum');
  return { amountMinor: sum, currency: a.currency };
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  const diff = a.amountMinor - b.amountMinor;
  assertInt64(diff, 'difference');
  return { amountMinor: diff, currency: a.currency };
}

export function negate(value: Money): Money {
  const n = -value.amountMinor;
  assertInt64(n, 'negation');
  return { amountMinor: n, currency: value.currency };
}

export function abs(value: Money): Money {
  return value.amountMinor < 0n ? negate(value) : value;
}

export function isZero(value: Money): boolean {
  return value.amountMinor === 0n;
}

export function isNegative(value: Money): boolean {
  return value.amountMinor < 0n;
}

export function compare(a: Money, b: Money): number {
  assertSameCurrency(a, b);
  if (a.amountMinor < b.amountMinor) return -1;
  if (a.amountMinor > b.amountMinor) return 1;
  return 0;
}

export function min(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

export function assertNonNegative(value: Money, label = 'amount'): void {
  if (value.amountMinor < 0n) {
    throw new MoneyError(`${label} must be non-negative`);
  }
}

export function assertPositive(value: Money, label = 'amount'): void {
  if (value.amountMinor <= 0n) {
    throw new MoneyError(`${label} must be positive`);
  }
}

/**
 * Basis-point share of an amount, truncated toward zero (bankers not required for V1 mock).
 * Rounding is defined once: integer division toward zero after multiplying by bps / 10_000.
 */
export function applyBps(value: Money, bps: number): Money {
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new MoneyError('bps must be an integer between 0 and 10000');
  }
  const share = (value.amountMinor * BigInt(bps)) / 10_000n;
  return { amountMinor: share, currency: value.currency };
}

export function formatUsd(value: Money): string {
  if (value.currency !== USD) {
    throw new MoneyError('formatUsd is USD-only');
  }
  const negative = value.amountMinor < 0n;
  const absMinor = negative ? -value.amountMinor : value.amountMinor;
  const dollars = absMinor / 100n;
  const cents = absMinor % 100n;
  const rendered = `$${dollars.toString()}.${cents.toString().padStart(2, '0')}`;
  return negative ? `-${rendered}` : rendered;
}

export const moneyWireSchema = z.object({
  amountMinor: z
    .string()
    .regex(/^-?\d+$/, 'amountMinor must be a base-10 integer string')
    .refine((s) => {
      try {
        parseMinor(s, 'amountMinor');
        return true;
      } catch {
        return false;
      }
    }, 'amountMinor overflows signed 64-bit'),
  currency: z.literal(USD),
});

export function parseMoneyWire(input: unknown): Money {
  const parsed = moneyWireSchema.parse(input);
  return fromWire(parsed);
}
