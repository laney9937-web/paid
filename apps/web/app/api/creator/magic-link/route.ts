import { NextResponse } from 'next/server';
import { MAGIC_LINK_TTL_MS, magicLinkPublicResponse } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { issueMagicLink } from '@paid/db';
import { withStore } from '../../../../src/server/store';
import { newId } from '@paid/domain';

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const email = String(form?.get('email') ?? (await request.json().catch(() => ({}))).email ?? '');
  const ack = magicLinkPublicResponse();
  if (email.includes('@')) {
    const issued = await issueMagicLink({
      email,
      keyring: loadConfig().tokenKeyring,
      ttlMs: MAGIC_LINK_TTL_MS,
    });
    if (issued.stored && issued.token) {
      await withStore((uow) =>
        uow.insertOutbox({
          id: newId(),
          type: 'EMAIL_MAGIC_LINK',
          payload: { toDigest: email.split('@')[0], template: 'magic-link' },
          dedupeKey: `magic-link:${email}:${Date.now()}`,
          availableAt: uow.clock.now(),
          attemptCount: 0,
          maxAttempts: 8,
          state: 'PENDING',
        }),
      );
      void issued.token;
    }
  }
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json(ack);
  }
  const url = new URL('/creator/sign-in', request.url);
  url.searchParams.set('sent', '1');
  return NextResponse.redirect(url, 303);
}
