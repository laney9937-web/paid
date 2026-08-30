import { cookies } from 'next/headers';
import { AppError } from '@paid/contracts';
import { GUEST_SESSION_COOKIE, OPS_SESSION_COOKIE, WEB_SESSION_COOKIE } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { lookupSession, type SessionKind } from '@paid/db';

export async function optionalCreatorSession() {
  const jar = await cookies();
  const raw = jar.get(WEB_SESSION_COOKIE)?.value;
  return lookupSession(raw, loadConfig().tokenKeyring, 'CREATOR');
}

export async function requireCreatorSession() {
  const jar = await cookies();
  const raw = jar.get(WEB_SESSION_COOKIE)?.value;
  const session = await lookupSession(raw, loadConfig().tokenKeyring, 'CREATOR');
  if (!session?.creatorId) {
    throw new AppError('UNAUTHENTICATED', 'Creator session required');
  }
  return { ...session, creatorId: session.creatorId };
}

export async function requireOpsSession() {
  const jar = await cookies();
  const raw = jar.get(OPS_SESSION_COOKIE)?.value;
  const session = await lookupSession(raw, loadConfig().tokenKeyring, 'OPS');
  if (!session) {
    throw new AppError('UNAUTHENTICATED', 'Staff session required');
  }
  return session;
}

export async function readGuestCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(GUEST_SESSION_COOKIE)?.value;
}

export function sessionKindCookie(kind: SessionKind) {
  return kind === 'OPS' ? OPS_SESSION_COOKIE : WEB_SESSION_COOKIE;
}
