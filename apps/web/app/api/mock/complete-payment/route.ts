import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError, money, successEnvelope } from '@paid/contracts';
import { processCanonicalProviderEvent } from '@paid/domain';
import { capturedEvent } from '@paid/test-support';
import { withStore } from '../../../../src/server/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  if (process.env.PROVIDER_MODE && process.env.PROVIDER_MODE !== 'mock') {
    return NextResponse.json(errorEnvelope('NOT_FOUND', 'Not found', false, requestId), {
      status: 404,
    });
  }
  try {
    const body = (await request.json()) as { transactionId?: string; publicOrderCode?: string };
    const result = await withStore(async (uow) => {
      const tx = body.transactionId
        ? await uow.getTransaction(body.transactionId)
        : body.publicOrderCode
          ? await uow.getTransactionByOrderCode(body.publicOrderCode)
          : null;
      if (!tx) {
        throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      }
      const event = capturedEvent({
        transactionId: tx.id,
        providerPaymentId: `pay_${tx.id}`,
        amount: money(tx.amount.amountMinor),
        occurredAt: uow.clock.now(),
        providerEventId: `evt_mock_${tx.id}`,
      });
      await processCanonicalProviderEvent(uow, uow.inbox, {
        actor: { actorType: 'PROVIDER', actorId: 'mock', authStrength: 'SERVICE', requestId },
        event,
        signatureValid: true,
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
    if ((error as { code?: string }).code === 'NOT_FOUND') {
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
