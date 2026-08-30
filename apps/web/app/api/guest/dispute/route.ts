import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError } from '@paid/contracts';
import { openInternalDispute, resolveGuestSession } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { readGuestCookie } from '../../../../src/server/session';
import { redirectToAppPath } from '../../../../src/server/app-redirect';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const form = await request.formData();
    const reasonCode = String(form.get('reasonCode') ?? 'NOT_DELIVERED');
    const cookie = await readGuestCookie();
    const publicOrderCode = await withStore(async (uow) => {
      const session = await resolveGuestSession(uow, cookie);
      if (!session) throw Object.assign(new Error('unauth'), { code: 'UNAUTHENTICATED' });
      const tx = await uow.getTransaction(session.transactionId);
      if (!tx) throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      await openInternalDispute(uow, {
        actor: {
          actorType: 'GUEST',
          guestTransactionId: session.transactionId,
          authStrength: 'EMAIL_LINK',
          requestId,
        },
        transactionId: session.transactionId,
        reasonCode,
      });
      return tx.publicOrderCode;
    });
    return redirectToAppPath(request, `/transaction/${publicOrderCode}`);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    return NextResponse.json(
      errorEnvelope('UNAUTHENTICATED', 'Guest session required', false, requestId),
      {
        status: 401,
      },
    );
  }
}
