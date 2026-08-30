import { NextResponse } from 'next/server';
import {
  MAGIC_LINK_TTL_MS,
  magicLinkContinuePath,
  magicLinkPublicResponse,
  readEmailField,
} from '@paid/auth';
import { loadConfig } from '@paid/config';
import { emailDigest, issueMagicLink } from '@paid/db';
import { withStore } from '../../../../src/server/store';
import { newId } from '@paid/domain';

export async function POST(request: Request) {
  const email = await readEmailField(request);
  const ack = magicLinkPublicResponse();
  if (email.includes('@')) {
    const issued = await issueMagicLink({
      email,
      keyring: loadConfig().tokenKeyring,
      ttlMs: MAGIC_LINK_TTL_MS,
      kind: 'CREATOR',
    });
    if (issued.stored && issued.token) {
      const origin = process.env.WEB_ORIGIN ?? new URL(request.url).origin;
      const continueUrl = `${origin}${magicLinkContinuePath(issued.token, 'CREATOR')}`;
      await withStore((uow) =>
        uow.insertOutbox({
          id: newId(),
          type: 'EMAIL_MAGIC_LINK',
          payload: {
            toDigest: emailDigest(email),
            template: 'magic-link',
            continueUrl,
          },
          dedupeKey: `magic-link:${emailDigest(email)}:${newId()}`,
          availableAt: uow.clock.now(),
          attemptCount: 0,
          maxAttempts: 8,
          state: 'PENDING',
        }),
      );
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
