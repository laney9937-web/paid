import { describe, expect, it } from 'vitest';
import { errorEnvelope, successEnvelope } from '@paid/contracts';
import { canonicalProviderEventSchema } from '@paid/contracts';
import { money } from '@paid/contracts';
import { toWire } from '@paid/contracts';

describe('API and event contracts', () => {
  it('success and error envelopes match last-mile shape', () => {
    expect(successEnvelope({ ok: true }, 'req_1')).toEqual({
      data: { ok: true },
      meta: { requestId: 'req_1', version: 1 },
    });
    expect(
      errorEnvelope('LINK_RESERVED', 'This transaction is currently in progress.', true, 'req_1'),
    ).toEqual({
      error: {
        code: 'LINK_RESERVED',
        message: 'This transaction is currently in progress.',
        retryable: true,
        requestId: 'req_1',
      },
    });
  });

  it('canonical provider event validates', () => {
    const parsed = canonicalProviderEventSchema.parse({
      canonicalEventId: 'canon_01',
      provider: 'mock',
      providerConfigurationId: 'cfg',
      adapterVersion: 'mock.v1',
      schemaVersion: 1,
      eventType: 'PAYMENT_CAPTURED',
      providerEventId: 'evt_1',
      providerResourceType: 'PAYMENT',
      providerResourceId: 'pay_1',
      occurredAt: '2026-08-29T16:00:00.000Z',
      receivedAt: '2026-08-29T16:00:01.000Z',
      amount: toWire(money('5000')),
      rawPayloadDigest: 'a'.repeat(64),
      verificationKeyVersion: 'v1',
      normalizedData: {},
    });
    expect(parsed.eventType).toBe('PAYMENT_CAPTURED');
  });
});
