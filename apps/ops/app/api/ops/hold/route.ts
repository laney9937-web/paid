import { NextResponse } from 'next/server';
import { requireFreshOpsRole, opsActorFromRequest } from '@paid/auth/http';
import { withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = await requireFreshOpsRole('RISK');
  } catch (error) {
    if (isAppError(error) && error.code === 'UNAUTHENTICATED') {
      return NextResponse.redirect(new URL('/ops/sign-in', request.url), 303);
    }
    if (isAppError(error) && error.code === 'STEP_UP_REQUIRED') {
      return NextResponse.redirect(new URL('/ops/step-up?reason=hold', request.url), 303);
    }
    if (isAppError(error)) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message, retryable: false, requestId } },
        { status: error.httpStatus },
      );
    }
    throw error;
  }
  const form = await request.formData();
  const creatorId = String(form.get('creatorId') ?? '');
  await withPostgresUow(async (uow) => {
    const creator = await uow.getCreator(creatorId);
    if (creator) {
      await uow.updateCreator({ ...creator, payoutHold: true, version: creator.version + 1 });
    }
    await uow.insertAudit({
      id: newId(),
      actor: opsActorFromRequest(session, requestId),
      action: 'PAYOUT_HOLD',
      subjectType: 'creator',
      subjectId: creatorId,
      createdAt: uow.clock.now(),
    });
  });
  return NextResponse.redirect(new URL('/ops/risk', request.url), 303);
}
