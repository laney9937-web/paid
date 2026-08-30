import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CREATOR_SESSION_IDLE_MS, WEB_SESSION_COOKIE, sessionCookieOptions } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { consumeMagicLink } from '@paid/db';
import { isAppError } from '@paid/contracts';

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get('token') ?? '');
  try {
    const consumed = await consumeMagicLink({
      token,
      keyring: loadConfig().tokenKeyring,
      kind: 'CREATOR',
      ttlMs: CREATOR_SESSION_IDLE_MS,
    });
    const jar = await cookies();
    const origin = process.env.WEB_ORIGIN ?? new URL(request.url).origin;
    jar.set({
      name: WEB_SESSION_COOKIE,
      value: consumed.sessionToken,
      ...sessionCookieOptions(origin),
      maxAge: Math.floor(CREATOR_SESSION_IDLE_MS / 1000),
    });
    return NextResponse.redirect(new URL('/creator/home', request.url), 303);
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.redirect(new URL('/creator/sign-in?error=1', request.url), 303);
    }
    return NextResponse.redirect(new URL('/creator/sign-in?error=1', request.url), 303);
  }
}
