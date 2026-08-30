import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError, successEnvelope, systemClock } from '@paid/contracts';
import { processCanonicalProviderEvent, resolveGuestSession } from '@paid/domain';
import { createMockPaymentsAdapter, signMockBody } from '@paid/payments-mock';
import { withStore } from '../../../../src/server/store';
import { readGuestCookie } from '../../../../src/server/session';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  if (process.env.PROVIDER_MODE && process.env.PROVIDER_MODE !== 'mock') {
    return NextResponse.json(errorEnvelope('NOT_FOUND', 'Not found', false, requestId), {
      status: 404,
    });
  }
  try {
    const cookie = await readGuestCookie();
    const result = await withStore(async (uow) => {
      const session = await resolveGuestSession(uow, cookie);
      if (!session) {
        throw Object.assign(new Error('unauth'), { code: 'UNAUTHENTICATED' });
      }
      const tx = await uow.getTransaction(session.transactionId);
      if (!tx) {
        throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      }
      const key = process.env.PROVIDER_WEBHOOK_SECRET_CURRENT || 'mock-webhook-key';
      const body = JSON.stringify({
        eventType: 'PAYMENT_CAPTURED',
        providerEventId: `evt_mock_${tx.id}`,
        providerResourceId: `pay_${tx.id}`,
        occurredAt: uow.clock.now().toISOString(),
        amount: {
          amountMinor: tx.amount.amountMinor.toString(),
          currency: tx.amount.currency,
        },
        transactionId: tx.id,
      });
      const adapter = createMockPaymentsAdapter({
        scenario: 'happy-path',
        clock: systemClock,
        currentKey: key,
        payments: new Map(),
        events: [],
      });
      const headers = new Headers();
      headers.set('x-mock-signature', signMockBody(body, key, 'v1'));
      headers.set('x-mock-timestamp', uow.clock.now().toISOString());
      const verified = await adapter.verifyAndNormalizeWebhook(
        new TextEncoder().encode(body),
        headers,
      );
      if (!verified.signatureValid) {
        throw Object.assign(new Error('unauth'), { code: 'UNAUTHENTICATED' });
      }
      await processCanonicalProviderEvent(uow, uow.inbox, {
        actor: { actorType: 'PROVIDER', actorId: 'mock', authStrength: 'SERVICE', requestId },
        event: {
          ...verified.event,
          normalizedData: { transactionId: tx.id },
        },
        signatureValid: verified.signatureValid,
        transactionId: tx.id,
      });
      const updated = await uow.getTransaction(tx.id);
      return { publicOrderCode: tx.publicOrderCode, paymentState: updated?.paymentState };
    });
    return NextResponse.json(successEnvelope(result, requestId));
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    const code = (error as { code?: string }).code;
    if (code === 'UNAUTHENTICATED') {
      return NextResponse.json(
        errorEnvelope('UNAUTHENTICATED', 'Guest session required', false, requestId),
        { status: 401 },
      );
    }
    if (code === 'NOT_FOUND') {
      return NextResponse.json(
        errorEnvelope('NOT_FOUND', 'Transaction not found', false, requestId),
        {
          status: 404,
        },
      );
    }
    return NextResponse.json(errorEnvelope('INTERNAL_ERROR', 'Unexpected error', true, requestId), {
      status: 500,
    });
  }
}
