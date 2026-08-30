import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError } from '@paid/contracts';
import { cancelTransactionLink } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSession } from '@paid/auth/http';
import { redirectToAppPath } from '../../../../src/server/app-redirect';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const session = await requireCreatorSession();
    const form = await request.formData();
    const linkId = String(form.get('linkId') ?? '');
    await withStore((uow) =>
      cancelTransactionLink(uow, {
        actor: {
          actorType: 'CREATOR',
          actorId: session.userId,
          creatorId: session.creatorId,
          authStrength: 'EMAIL_LINK',
          requestId,
        },
        linkId,
      }),
    );
    return redirectToAppPath(request, '/creator/create');
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
