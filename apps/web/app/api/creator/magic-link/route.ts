import { NextResponse } from 'next/server';
import { generateSecretToken, hmacToken } from '@paid/contracts';
import { magicLinkPublicResponse } from '@paid/auth';
import { withStore } from '../../../../src/server/store';

export async function POST(request: Request) {
  const token = generateSecretToken();
  await withStore(async (uow) => {
    hmacToken(uow.config.tokenKeyring, token);
  });
  const ack = magicLinkPublicResponse();
  const accept = request.headers.get('accept') ?? '';
  if (accept.includes('application/json')) {
    return NextResponse.json(ack);
  }
  const url = new URL('/creator/sign-in', request.url);
  url.searchParams.set('sent', '1');
  return NextResponse.redirect(url, 303);
}
