import { NextResponse } from 'next/server';
import { requireFreshOpsRole, opsActorFromRequest } from '@paid/auth/http';
import { loadReconSnapshot, withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';
import { isAppError } from '@paid/contracts';
import { runReconciliation } from '@paid/reconciliation';

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
  const snapshot = await loadReconSnapshot();
  const breaks = runReconciliation({
    internalCaptures: snapshot.internalCaptures,
    providerCaptures: snapshot.providerCaptures,
    internalRefunds: snapshot.internalRefunds,
    providerRefunds: snapshot.providerRefunds,
    internalPayouts: snapshot.internalPayouts,
    providerPayouts: snapshot.providerPayouts,
    source: snapshot,
  });
  await withPostgresUow(async (uow) => {
    await uow.insertAudit({
      id: newId(),
      actor: opsActorFromRequest(session, requestId),
      action: 'RECONCILIATION_RUN',
      subjectType: 'system',
      subjectId: 'reconciliation',
      afterDigest: JSON.stringify({ breaks: breaks.length, reason, idempotencyKey }),
      createdAt: uow.clock.now(),
    });
  });
  return NextResponse.redirect(new URL('/ops/reconciliation', request.url), 303);
}
