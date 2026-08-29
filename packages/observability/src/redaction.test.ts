import { describe, expect, it } from 'vitest';
import { assertNoSensitive } from './index';

describe('log redaction guards', () => {
  it('rejects PAN/CVV keys in telemetry payloads', () => {
    expect(() => assertNoSensitive({ pan: '4111111111111111', cvv: '123' })).toThrow();
    expect(() => assertNoSensitive({ order: 'A82F9K3M2Q', amountMinor: '5000' })).not.toThrow();
  });
});
