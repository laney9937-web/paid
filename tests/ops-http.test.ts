import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { actorFromSession } from '@paid/auth';
import { loadConfig } from '@paid/config';
import { LOCAL_DEV_OPS_SESSION, loadLocalEnv, lookupSession, withPostgresUow } from '@paid/db';
import { placePayoutHold, restrictCreatorCheckout } from '@paid/domain';

loadLocalEnv();

describe('ops mutations deny SUPPORT', () => {
  it('verified SUPPORT session cannot hold or restrict', async () => {
    const session = await lookupSession(LOCAL_DEV_OPS_SESSION, loadConfig().tokenKeyring, 'OPS');
    expect(session?.opsRoles).toEqual(['SUPPORT']);
    expect(session?.authStrength).toBe('EMAIL_LINK');
    const actor = actorFromSession(session!, 'req-support');
    await withPostgresUow(async (uow) => {
      await expect(
        placePayoutHold(uow, {
          actor,
          creatorId: 'creator_maya',
          reason: 'support-denied',
          idempotencyKey: 'support-hold-http',
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(
        restrictCreatorCheckout(uow, {
          actor,
          creatorId: 'creator_maya',
          reason: 'support-denied',
          idempotencyKey: 'support-restrict-http',
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  it('HTTP mutation routes require a fresh privileged role', () => {
    const hold = readFileSync(
      new URL('../apps/ops/app/api/ops/hold/route.ts', import.meta.url),
      'utf8',
    );
    const restrict = readFileSync(
      new URL('../apps/ops/app/api/ops/restrict/route.ts', import.meta.url),
      'utf8',
    );
    const recon = readFileSync(
      new URL('../apps/ops/app/api/ops/reconciliation/route.ts', import.meta.url),
      'utf8',
    );
    const inbox = readFileSync(
      new URL('../apps/ops/app/api/ops/inbox/retry/route.ts', import.meta.url),
      'utf8',
    );
    const outbox = readFileSync(
      new URL('../apps/ops/app/api/ops/outbox/retry/route.ts', import.meta.url),
      'utf8',
    );
    expect(hold).toContain("requireFreshOpsRole('RISK')");
    expect(hold).toContain('placePayoutHold');
    expect(hold).toContain('reason');
    expect(hold).toContain('idempotencyKey');
    expect(restrict).toContain("requireFreshOpsRole('COMPLIANCE')");
    expect(recon).toContain("requireFreshOpsRole('PAYMENTS')");
    expect(inbox).toContain("requireFreshOpsRole('PAYMENTS')");
    expect(outbox).toContain("requireFreshOpsRole('SECURITY')");
  });
});
