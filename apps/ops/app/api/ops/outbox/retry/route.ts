import { NextResponse } from 'next/server';
import { requireFreshOpsRole, opsActorFromRequest } from '@paid/auth/http';
import { retryDeadLetter, withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = await requireFreshOpsRole('SECURITY');
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
  const jobId = String(form.get('jobId') ?? '');
  const reason = String(form.get('reason') ?? '').trim();
  const idempotencyKey = String(form.get('idempotencyKey') ?? '').trim();
  if (!jobId || reason.length < 3 || idempotencyKey.length < 8) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Job, reason, and idempotency key are required',
          retryable: false,
          requestId,
        },
      },
      { status: 400 },
    );
  }
  await retryDeadLetter(jobId);
  await withPostgresUow(async (uow) => {
    await uow.insertAudit({
      id: newId(),
      actor: opsActorFromRequest(session, requestId),
      action: 'OUTBOX_RETRY',
      subjectType: 'outbox',
      subjectId: jobId,
      afterDigest: reason,
      createdAt: uow.clock.now(),
    });
  });
  return NextResponse.redirect(new URL('/ops/outbox', request.url), 303);
}
