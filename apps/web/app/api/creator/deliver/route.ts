import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError } from '@paid/contracts';
import { markDelivered } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSession } from '../../../../src/server/session';
import { redirectToAppPath } from '../../../../src/server/app-redirect';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const session = await requireCreatorSession();
    const form = await request.formData();
    const transactionId = String(form.get('transactionId') ?? '');
    await withStore((uow) =>
      markDelivered(uow, {
        actor: {
          actorType: 'CREATOR',
          actorId: session.userId,
          creatorId: session.creatorId,
          authStrength: 'EMAIL_LINK',
          requestId,
        },
        transactionId,
        method: 'external',
      }),
    );
    return redirectToAppPath(request, `/creator/transactions/${transactionId}`);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    return NextResponse.json(
      errorEnvelope('UNAUTHENTICATED', 'Creator session required', false, requestId),
      {
        status: 401,
      },
    );
  }
}
