import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { CREATOR_SESSION_IDLE_MS, WEB_SESSION_COOKIE, sessionCookieOptions } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { consumeMagicLink } from '@paid/db';

export async function GET() {
  return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
}

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
    redirect('/creator/home');
  } catch (error) {
    if (typeof error === 'object' && error && 'digest' in error) {
      throw error;
    }
    redirect('/creator/sign-in?error=1');
  }
}
