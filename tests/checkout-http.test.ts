import { describe, expect, it } from 'vitest';
import { loadLocalEnv } from '@paid/db';
import { POST } from '../apps/web/app/api/transactions/checkout-sessions/route';

loadLocalEnv();

describe('checkout HTTP body', () => {
  it('rejects extra client geo fields instead of trusting buyerJurisdiction', async () => {
    const res = await POST(
      new Request('http://127.0.0.1:3000/api/transactions/checkout-sessions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': 'checkout-extra-1',
        },
        body: JSON.stringify({ shareId: 'ABCDEFGH', buyerJurisdiction: 'US' }),
      }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe('VALIDATION_FAILED');
  });
});
