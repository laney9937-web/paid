import { NextResponse } from 'next/server';
import { requireFreshOpsRole, opsActorFromRequest } from '@paid/auth/http';
import { withPostgresUow } from '@paid/db';
import { restrictCreatorCheckout } from '@paid/domain';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = await requireFreshOpsRole('COMPLIANCE');
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, retryable: false, requestId } },
        { status: error.httpStatus },
      );
    }
    throw error;
  }
  const form = await request.formData();
  try {
    await withPostgresUow(async (uow) => {
      await restrictCreatorCheckout(uow, {
        actor: opsActorFromRequest(session, requestId),
        creatorId: String(form.get('creatorId') ?? ''),
        reason: String(form.get('reason') ?? ''),
        idempotencyKey: String(form.get('idempotencyKey') ?? ''),
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            retryable: error.retryable,
            requestId,
          },
        },
        { status: error.httpStatus },
      );
    }
    throw error;
  }
  return NextResponse.redirect(new URL('/ops/compliance', request.url), 303);
}
