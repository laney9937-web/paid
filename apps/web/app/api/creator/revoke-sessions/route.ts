import { NextResponse } from 'next/server';
import { requireCreatorSession } from '@paid/auth/http';
import { revokeUserSessions } from '@paid/db';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  try {
    const session = await requireCreatorSession();
    await revokeUserSessions(session.userId);
    return NextResponse.redirect(new URL('/creator/sign-in', request.url), 303);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.redirect(new URL('/creator/sign-in', request.url), 303);
    }
    return NextResponse.redirect(new URL('/creator/sign-in', request.url), 303);
  }
}
