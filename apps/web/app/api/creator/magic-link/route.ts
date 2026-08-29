import { NextResponse } from 'next/server';
import { generateSecretToken, hmacToken } from '@paid/contracts';
import { getStore } from '../../../../src/server/store';

export async function POST() {
  const token = generateSecretToken();
  hmacToken(getStore().config.tokenKeyring, token);
  return NextResponse.redirect(new URL('/creator/sign-in', 'http://localhost:3000'), 303);
}
