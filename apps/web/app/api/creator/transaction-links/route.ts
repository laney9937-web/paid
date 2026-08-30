import { NextResponse } from 'next/server';
import {
  errorEnvelope,
  isAppError,
  successEnvelope,
  type DeliveryDuration,
  type TransactionCategory,
} from '@paid/contracts';
import { createTransactionLink } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSession } from '../../../../src/server/session';

export const dynamic = 'force-dynamic';

function dollarsToMinor(value: string): string {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(value.trim());
  if (!match) {
    throw Object.assign(new Error('invalid-amount'), { code: 'VALIDATION_FAILED' });
  }
  const dollars = match[1] ?? '0';
  const cents = (match[2] ?? '00').padEnd(2, '0');
  return (BigInt(dollars) * 100n + BigInt(cents)).toString();
}

export async function POST(request: Request) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  try {
    const body = (await request.json()) as {
      amount?: string;
      category?: TransactionCategory;
      deliveryDuration?: DeliveryDuration;
    };
    if (!body.amount || !body.category || !body.deliveryDuration) {
      return NextResponse.json(
        errorEnvelope(
          'VALIDATION_FAILED',
          'amount, category, and deliveryDuration are required',
          false,
          requestId,
        ),
        { status: 400 },
      );
    }
    const session = await requireCreatorSession();
    const link = await withStore((uow) =>
      createTransactionLink(uow, {
        actor: {
          actorType: 'CREATOR',
          actorId: session.userId,
          creatorId: session.creatorId,
          sessionId: session.id,
          authStrength: 'EMAIL_LINK',
          requestId,
        },
        amountMinor: dollarsToMinor(body.amount!),
        category: body.category!,
        deliveryDuration: body.deliveryDuration!,
      }),
    );
    return NextResponse.json(
      successEnvelope(
        {
          shareId: link.shareId,
          path: `/t/${link.shareId}`,
          amountMinor: link.amount.amountMinor.toString(),
          deliveryDuration: link.deliveryDuration,
        },
        requestId,
      ),
    );
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    if ((error as { code?: string }).code === 'VALIDATION_FAILED') {
      return NextResponse.json(
        errorEnvelope(
          'VALIDATION_FAILED',
          'Amount must be dollars and cents, for example 50.00',
          false,
          requestId,
        ),
        { status: 400 },
      );
    }
    return NextResponse.json(errorEnvelope('INTERNAL_ERROR', 'Unexpected error', true, requestId), {
      status: 500,
    });
  }
}
