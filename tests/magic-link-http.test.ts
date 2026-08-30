import { describe, expect, it } from 'vitest';
import {
  MAGIC_LINK_PUBLIC_ACK,
  CREATOR_SESSION_IDLE_MS,
  OPS_SESSION_IDLE_MS,
  WEB_SESSION_COOKIE,
  OPS_SESSION_COOKIE,
} from '@paid/auth';
import { loadConfig } from '@paid/config';
import { consumeMagicLink, emailDigest, getSql, loadLocalEnv, peekMagicLink } from '@paid/db';
import { POST as issueCreator } from '../apps/web/app/api/creator/magic-link/route';
import { GET as getCreatorConsume } from '../apps/web/app/api/creator/magic-link/consume/route';
import { POST as issueOps } from '../apps/ops/app/api/ops/magic-link/route';
import { GET as getOpsConsume } from '../apps/ops/app/api/ops/magic-link/consume/route';

loadLocalEnv();

async function latestContinueUrl(template: string): Promise<string> {
  const sql = getSql();
  const rows = await sql`
    SELECT payload FROM outbox_jobs
    WHERE type = 'EMAIL_MAGIC_LINK'
    ORDER BY created_at DESC
    LIMIT 16
  `;
  for (const raw of rows) {
    const payload = (raw as { payload: { continueUrl?: string; template?: string } }).payload;
    if (payload?.template === template && payload.continueUrl) return payload.continueUrl;
  }
  throw new Error(`missing ${template} continueUrl in outbox`);
}

function tokenFrom(continueUrl: string): string {
  const token = new URL(continueUrl).searchParams.get('token');
  if (!token) throw new Error('continueUrl missing token');
  return token;
}

describe('magic-link HTTP issue and consume', () => {
  it('POST issue stores hashed token, emails continueUrl, GET consume does not consume', async () => {
    const unknown = await issueCreator(
      new Request('http://127.0.0.1:3000/api/creator/magic-link', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@paid.example' }),
      }),
    );
    const unknownBody = await unknown.json();
    expect(unknownBody.message).toBe(MAGIC_LINK_PUBLIC_ACK);

    const issued = await issueCreator(
      new Request('http://127.0.0.1:3000/api/creator/magic-link', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'maya@paid.example' }),
      }),
    );
    const body = await issued.json();
    expect(body.message).toBe(MAGIC_LINK_PUBLIC_ACK);
    expect(JSON.stringify(body)).not.toMatch(/token=/);

    const continueUrl = await latestContinueUrl('magic-link');
    const token = tokenFrom(continueUrl);
    expect(continueUrl).toContain('/creator/sign-in/continue?token=');
    expect(JSON.stringify(body)).not.toContain(token);
    expect(continueUrl).not.toContain('maya@paid.example');
    const sql = getSql();
    const jobs = await sql`
      SELECT payload FROM outbox_jobs WHERE type = 'EMAIL_MAGIC_LINK' ORDER BY created_at DESC LIMIT 1
    `;
    const payload = (jobs[0] as { payload: { toDigest: string; continueUrl: string } }).payload;
    expect(payload.toDigest).toBe(emailDigest('maya@paid.example'));
    expect(payload.continueUrl).toBe(continueUrl);

    const keyring = loadConfig().tokenKeyring;
    expect(await peekMagicLink({ token, keyring, kind: 'CREATOR' })).toMatchObject({
      valid: true,
      consumed: false,
      expired: false,
    });
    expect(await peekMagicLink({ token, keyring, kind: 'OPS' })).toMatchObject({ valid: false });
    const getRes = await getCreatorConsume();
    expect(getRes.status).toBe(405);
    expect(await peekMagicLink({ token, keyring, kind: 'CREATOR' })).toMatchObject({
      valid: true,
      consumed: false,
    });

    const first = await consumeMagicLink({
      token,
      keyring,
      kind: 'CREATOR',
      ttlMs: CREATOR_SESSION_IDLE_MS,
    });
    expect(first.creatorId).toBe('creator_maya');
    expect(first.sessionToken.length).toBeGreaterThan(20);
    expect(first.sessionToken).not.toBe(token);
    expect(await peekMagicLink({ token, keyring, kind: 'CREATOR' })).toMatchObject({
      valid: false,
      consumed: true,
    });
    await expect(
      consumeMagicLink({ token, keyring, kind: 'CREATOR', ttlMs: CREATOR_SESSION_IDLE_MS }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(WEB_SESSION_COOKIE).toBe('paid_session');
  });

  it('ops POST issue delivers a staff continueUrl and GET consume does not consume', async () => {
    const issued = await issueOps(
      new Request('http://127.0.0.1:3001/api/ops/magic-link', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'ops@paid.example' }),
      }),
    );
    const body = await issued.json();
    expect(body.message).toBe(MAGIC_LINK_PUBLIC_ACK);
    const continueUrl = await latestContinueUrl('magic-link-ops');
    const token = tokenFrom(continueUrl);
    expect(continueUrl).toContain('/ops/sign-in/continue?token=');
    expect(JSON.stringify(body)).not.toContain(token);
    expect(await getOpsConsume()).toMatchObject({ status: 405 });
    const keyring = loadConfig().tokenKeyring;
    expect(await peekMagicLink({ token, keyring, kind: 'OPS' })).toMatchObject({
      valid: true,
      consumed: false,
    });
    const session = await consumeMagicLink({
      token,
      keyring,
      kind: 'OPS',
      ttlMs: OPS_SESSION_IDLE_MS,
    });
    expect(session.creatorId).toBeNull();
    expect(session.userId).toBe('user_ops');
    expect(OPS_SESSION_COOKIE).toBe('paid_ops_session');
    expect(OPS_SESSION_COOKIE).not.toBe(WEB_SESSION_COOKIE);
  });

  it('Maya cannot obtain an OPS magic-link or paid_ops_session', async () => {
    const sql = getSql();
    const before = await sql`
      SELECT count(*)::int AS n FROM auth_tokens WHERE purpose = 'MAGIC_LINK_OPS'
    `;
    const beforeN = Number((before[0] as { n: number }).n);
    const issued = await issueOps(
      new Request('http://127.0.0.1:3001/api/ops/magic-link', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'maya@paid.example' }),
      }),
    );
    const body = await issued.json();
    expect(body.message).toBe(MAGIC_LINK_PUBLIC_ACK);
    const after = await sql`
      SELECT count(*)::int AS n FROM auth_tokens WHERE purpose = 'MAGIC_LINK_OPS'
    `;
    expect(Number((after[0] as { n: number }).n)).toBe(beforeN);

    const creatorIssued = await issueCreator(
      new Request('http://127.0.0.1:3000/api/creator/magic-link', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'maya@paid.example' }),
      }),
    );
    expect((await creatorIssued.json()).message).toBe(MAGIC_LINK_PUBLIC_ACK);
    const continueUrl = await latestContinueUrl('magic-link');
    const token = tokenFrom(continueUrl);
    const keyring = loadConfig().tokenKeyring;
    await expect(
      consumeMagicLink({ token, keyring, kind: 'OPS', ttlMs: OPS_SESSION_IDLE_MS }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    expect(await peekMagicLink({ token, keyring, kind: 'CREATOR' })).toMatchObject({
      valid: true,
      consumed: false,
    });
  });
});
