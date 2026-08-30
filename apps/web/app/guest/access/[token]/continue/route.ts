import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { exchangeGuestToken } from '@paid/domain';
import { GUEST_SESSION_COOKIE, sessionCookieOptions } from '@paid/auth';
import { withStore } from '../../../../../src/server/store';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  try {
    const result = await withStore((uow) =>
      exchangeGuestToken(uow, {
        actor: { actorType: 'PUBLIC', authStrength: 'NONE', requestId: crypto.randomUUID() },
        token,
      }),
    );
    const jar = await cookies();
    const origin = process.env.WEB_ORIGIN ?? 'http://localhost:3000';
    jar.set({
      name: GUEST_SESSION_COOKIE,
      value: result.sessionToken,
      ...sessionCookieOptions(origin),
      maxAge: 7 * 24 * 3600,
    });
    redirect(`/transaction/${result.publicOrderCode}`);
  } catch (error) {
    if (typeof error === 'object' && error && 'digest' in error) {
      throw error;
    }
    redirect(`/guest/access/${encodeURIComponent(token)}`);
  }
}
