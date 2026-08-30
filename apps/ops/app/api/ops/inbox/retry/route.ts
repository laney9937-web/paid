import { NextResponse } from 'next/server';
import { requireFreshOpsRole, opsActorFromRequest } from '@paid/auth/http';
import { withPostgresUow } from '@paid/db';
import { newId, recoverPendingProviderEvents } from '@paid/domain';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  let session;
  try {
    session = await requireFreshOpsRole('PAYMENTS');
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
  const reason = String(form.get('reason') ?? '').trim();
  const idempotencyKey = String(form.get('idempotencyKey') ?? '').trim();
  if (reason.length < 3 || idempotencyKey.length < 8) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Reason and idempotency key are required',
          retryable: false,
          requestId,
        },
      },
      { status: 400 },
    );
  }
  const recovered = await withPostgresUow(async (uow) => {
    const results = await recoverPendingProviderEvents(uow, uow.inbox);
    await uow.insertAudit({
      id: newId(),
      actor: opsActorFromRequest(session, requestId),
      action: 'INBOX_RETRY',
      subjectType: 'system',
      subjectId: 'provider_inbox',
      afterDigest: JSON.stringify({ count: results.length, reason }),
      createdAt: uow.clock.now(),
    });
    return results;
  });
  void recovered;
  return NextResponse.redirect(new URL('/ops/inbox', request.url), 303);
}
