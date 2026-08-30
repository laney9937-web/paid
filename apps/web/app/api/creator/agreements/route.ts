import { NextResponse } from 'next/server';
import { newId } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSession } from '../../../../src/server/session';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  try {
    const session = await requireCreatorSession();
    await withStore((uow) =>
      uow.insertAudit({
        id: newId(),
        actor: {
          actorType: 'CREATOR',
          actorId: session.userId,
          creatorId: session.creatorId,
          authStrength: 'EMAIL_LINK',
          requestId: crypto.randomUUID(),
        },
        action: 'AGREEMENT_ACCEPTED',
        subjectType: 'creator',
        subjectId: session.creatorId,
        afterDigest: 'agreement.v1.mock',
        createdAt: uow.clock.now(),
      }),
    );
    return NextResponse.redirect(new URL('/creator/home', request.url), 303);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.redirect(new URL('/creator/sign-in', request.url), 303);
    }
    return NextResponse.redirect(new URL('/creator/sign-in', request.url), 303);
  }
}
