import { NextResponse } from 'next/server';
import {
  MAGIC_LINK_TTL_MS,
  magicLinkContinuePath,
  magicLinkPublicResponse,
  readEmailField,
} from '@paid/auth';
import { loadConfig, takeRateLimit } from '@paid/config';
import { emailDigest, issueMagicLink } from '@paid/db';
import { withStore } from '../../../../src/server/store';
import { newId, sealSecret } from '@paid/domain';

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'local';
  if (!takeRateLimit(`magic:${ip}`, 20, 60_000)) {
    return NextResponse.json(magicLinkPublicResponse());
  }
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
      await withStore(async (uow) => {
        const sealed = sealSecret(continueUrl, uow.config.restrictedFieldKeyring);
        const envelopeId = newId();
        await uow.insertSecretEnvelope({
          id: envelopeId,
          purpose: 'MAGIC_LINK',
          credentialId: null,
          ciphertext: sealed.ciphertext,
          nonce: sealed.nonce,
          authTag: sealed.authTag,
          keyVersion: sealed.keyVersion,
          expiresAt: new Date(uow.clock.now().getTime() + MAGIC_LINK_TTL_MS),
          consumedAt: null,
          createdAt: uow.clock.now(),
        });
        await uow.insertOutbox({
          id: newId(),
          type: 'EMAIL_MAGIC_LINK',
          payload: {
            toDigest: emailDigest(email),
            template: 'magic-link',
            envelopeId,
          },
          dedupeKey: `magic-link:${emailDigest(email)}:${newId()}`,
          availableAt: uow.clock.now(),
          attemptCount: 0,
          maxAttempts: 8,
          state: 'PENDING',
        });
      });
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
