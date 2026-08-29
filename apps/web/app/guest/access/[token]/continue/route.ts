import { NextResponse } from 'next/server';
import { exchangeGuestToken } from '@paid/domain';
import { GUEST_SESSION_COOKIE, sessionCookieOptions } from '@paid/auth';
import { getStore } from '../../../../../src/server/store';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const origin = new URL(request.url).origin;
  try {
    const result = await exchangeGuestToken(getStore(), {
      actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId: crypto.randomUUID() },
      token,
    });
    const res = NextResponse.redirect(new URL(`/transaction/${result.publicOrderCode}`, origin));
    res.cookies.set(GUEST_SESSION_COOKIE, result.transactionId, {
      ...sessionCookieOptions(origin),
      maxAge: 7 * 24 * 3600,
    });
    return res;
  } catch {
    return NextResponse.redirect(new URL(`/guest/access/${encodeURIComponent(token)}`, origin));
  }
}
