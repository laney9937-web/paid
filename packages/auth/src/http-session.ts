import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppError } from '@paid/contracts';
import { loadConfig } from '@paid/config';
import { lookupSession, type SessionKind } from '@paid/db';
import { GUEST_SESSION_COOKIE, OPS_SESSION_COOKIE, WEB_SESSION_COOKIE } from './cookies';

export async function optionalCreatorSession() {
  const jar = await cookies();
  const raw = jar.get(WEB_SESSION_COOKIE)?.value;
  return lookupSession(raw, loadConfig().tokenKeyring, 'CREATOR');
}

export async function requireCreatorSession() {
  const session = await optionalCreatorSession();
  if (!session?.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  return { ...session, creatorId: session.creatorId };
}

export async function requireCreatorSessionOrRedirect() {
  const session = await optionalCreatorSession();
  if (!session?.creatorId) redirect('/creator/sign-in');
  return { ...session, creatorId: session.creatorId as string };
}

export async function optionalOpsSession() {
  const jar = await cookies();
  const raw = jar.get(OPS_SESSION_COOKIE)?.value;
  return lookupSession(raw, loadConfig().tokenKeyring, 'OPS');
}

export async function requireOpsSession() {
  const session = await optionalOpsSession();
  if (!session) {
    throw new AppError('UNAUTHENTICATED', 'Staff session required');
  }
  return session;
}

export async function requireOpsSessionOrRedirect() {
  const session = await optionalOpsSession();
  if (!session) redirect('/ops/sign-in');
  return session;
}

export async function readGuestCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(GUEST_SESSION_COOKIE)?.value;
}

export function sessionKindCookie(kind: SessionKind) {
  return kind === 'OPS' ? OPS_SESSION_COOKIE : WEB_SESSION_COOKIE;
}
