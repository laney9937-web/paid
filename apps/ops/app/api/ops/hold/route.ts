import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { OPS_SESSION_COOKIE } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { lookupSession, withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';

export async function POST(request: Request) {
  const raw = (await cookies()).get(OPS_SESSION_COOKIE)?.value;
  const session = await lookupSession(raw, loadConfig().tokenKeyring, 'OPS');
  if (!session) {
    return NextResponse.redirect(new URL('/ops/sign-in', request.url), 303);
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
