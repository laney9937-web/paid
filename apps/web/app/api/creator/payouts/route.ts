import { NextResponse } from 'next/server';
import { errorEnvelope, isAppError } from '@paid/contracts';
import { requestPayout } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSession } from '@paid/auth/http';
import { actorFromSession } from '@paid/auth';
import { redirectToAppPath } from '../../../../src/server/app-redirect';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const session = await requireCreatorSession();
    const form = await request.formData().catch(() => null);
    const amountMinor = String(form?.get('amountMinor') ?? '100');
    await withStore((uow) =>
      requestPayout(uow, {
        actor: actorFromSession(session, requestId),
        creatorId: session.creatorId,
        amountMinor,
        destinationAgeHours: 72,
        idempotencyKey: requestId,
      }),
    );
    return redirectToAppPath(request, '/creator/payouts');
  } catch (error) {
    if (isAppError(error) && error.code === 'STEP_UP_REQUIRED') {
      return redirectToAppPath(request, '/creator/security?stepUp=payout');
    }
    if (isAppError(error)) {
      return NextResponse.json(
        errorEnvelope(error.code, error.message, error.retryable, requestId),
        { status: error.httpStatus },
      );
    }
    return NextResponse.json(
      errorEnvelope('UNAUTHENTICATED', 'Creator session required', false, requestId),
      { status: 401 },
    );
  }
}
