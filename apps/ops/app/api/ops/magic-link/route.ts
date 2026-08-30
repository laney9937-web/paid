import { NextResponse } from 'next/server';
import {
  MAGIC_LINK_TTL_MS,
  magicLinkContinuePath,
  magicLinkPublicResponse,
  readEmailField,
} from '@paid/auth';
import { loadConfig } from '@paid/config';
import { emailDigest, issueMagicLink, withPostgresUow } from '@paid/db';
import { newId } from '@paid/domain';

export async function POST(request: Request) {
  const email = await readEmailField(request);
  const ack = magicLinkPublicResponse();
  if (email.includes('@')) {
    const issued = await issueMagicLink({
      email,
      keyring: loadConfig().tokenKeyring,
      ttlMs: MAGIC_LINK_TTL_MS,
      kind: 'OPS',
    });
    if (issued.stored && issued.token) {
      const origin = process.env.OPS_ORIGIN ?? new URL(request.url).origin;
      const continueUrl = `${origin}${magicLinkContinuePath(issued.token, 'OPS')}`;
      await withPostgresUow((uow) =>
        uow.insertOutbox({
          id: newId(),
          type: 'EMAIL_MAGIC_LINK',
          payload: {
            toDigest: emailDigest(email),
            template: 'magic-link-ops',
            continueUrl,
          },
          dedupeKey: `magic-link-ops:${emailDigest(email)}:${newId()}`,
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
  const url = new URL('/ops/sign-in', request.url);
  url.searchParams.set('sent', '1');
  return NextResponse.redirect(url, 303);
}
