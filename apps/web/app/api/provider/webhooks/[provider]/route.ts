import { NextResponse } from 'next/server';
import { FakeClock } from '@paid/contracts';
import { createMockPaymentsAdapter } from '@paid/payments-mock';
import { processCanonicalProviderEvent } from '@paid/domain';
import { MemoryInbox } from '@paid/test-support';
import { getStore } from '../../../../../src/server/store';

const inbox = new MemoryInbox();

export async function POST(request: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (provider !== 'mock') {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  const raw = new Uint8Array(await request.arrayBuffer());
  if (raw.byteLength > 64_000) {
    return NextResponse.json({ ok: false }, { status: 413 });
  }
  const adapter = createMockPaymentsAdapter({
    scenario: 'happy-path',
    clock: new FakeClock(),
    currentKey: 'mock-webhook-key',
    payments: new Map(),
    events: [],
  });
  try {
    const verified = await adapter.verifyAndNormalizeWebhook(raw, request.headers);
    const txId = (verified.event.normalizedData as { transactionId?: string } | undefined)
      ?.transactionId;
    await processCanonicalProviderEvent(getStore(), inbox, {
      actor: {
        actorType: 'PROVIDER',
        actorId: 'mock',
        authStrength: 'SERVICE',
        requestId: crypto.randomUUID(),
      },
      event: verified.event,
      signatureValid: verified.signatureValid,
      transactionId: txId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
}
