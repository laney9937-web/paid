import { NextResponse } from 'next/server';
import { requireOpsSession } from '@paid/auth/http';
import { withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  let session;
  try {
    session = await requireOpsSession();
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.redirect(new URL('/ops/sign-in', request.url), 303);
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
      actor: {
        actorType: 'OPS',
        actorId: session.userId,
        opsRoles: ['RISK'],
        authStrength: 'PASSKEY',
        requestId: crypto.randomUUID(),
      },
      action: 'PAYOUT_HOLD',
      subjectType: 'creator',
      subjectId: creatorId,
      createdAt: uow.clock.now(),
    });
  });
  return NextResponse.redirect(new URL('/ops/cases', request.url), 303);
}
