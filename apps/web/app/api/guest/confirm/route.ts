import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError } from '@paid/contracts';
import { confirmDelivery, resolveGuestSession } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { readGuestCookie } from '../../../../src/server/session';
import { redirectToAppPath } from '../../../../src/server/app-redirect';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const cookie = await readGuestCookie();
    const publicOrderCode = await withStore(async (uow) => {
      const session = await resolveGuestSession(uow, cookie);
      if (!session) throw Object.assign(new Error('unauth'), { code: 'UNAUTHENTICATED' });
      const tx = await uow.getTransaction(session.transactionId);
      if (!tx) throw Object.assign(new Error('not-found'), { code: 'NOT_FOUND' });
      await confirmDelivery(uow, {
        actor: {
          actorType: 'GUEST',
          guestTransactionId: session.transactionId,
          authStrength: 'EMAIL_LINK',
          requestId,
        },
        transactionId: session.transactionId,
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
