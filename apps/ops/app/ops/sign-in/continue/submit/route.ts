import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { OPS_SESSION_COOKIE, OPS_SESSION_IDLE_MS, sessionCookieOptions } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { consumeMagicLink } from '@paid/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get('token') ?? '');
  try {
    const consumed = await consumeMagicLink({
      token,
      keyring: loadConfig().tokenKeyring,
      kind: 'OPS',
      ttlMs: OPS_SESSION_IDLE_MS,
    });
    const jar = await cookies();
    const origin = process.env.OPS_ORIGIN ?? new URL(request.url).origin;
    jar.set({
      name: OPS_SESSION_COOKIE,
      value: consumed.sessionToken,
      ...sessionCookieOptions(origin),
      maxAge: Math.floor(OPS_SESSION_IDLE_MS / 1000),
    });
    redirect('/ops/cases');
  } catch (error) {
    if (typeof error === 'object' && error && 'digest' in error) {
      throw error;
    }
    redirect('/ops/sign-in?error=1');
  }
}
