import { describe, expect, it } from 'vitest';
import { money } from '@paid/contracts';
import { createCheckout, createTransactionLink, processCanonicalProviderEvent } from '@paid/domain';
import { getSql, withPostgresUow } from '@paid/db';
import { capturedEvent, creatorActor, publicActor } from '@paid/test-support';

const allow = {
  outcome: 'ALLOW' as const,
  reasons: [] as string[],
  policyVersion: 'compliance.v1.mock',
};

describe('postgres unit of work', () => {
  it('rolls back domain writes when the command throws before commit', async () => {
    const marker = `boom-${Date.now()}`;
    await expect(
      withPostgresUow(async (uow) => {
        await createTransactionLink(uow, {
          actor: creatorActor(),
          amountMinor: '5100',
          category: 'DIGITAL_COMMISSION',
          deliveryDuration: 'PT24H',
          note: marker,
        });
        throw new Error('forced-rollback');
      }),
    ).rejects.toThrow('forced-rollback');

    const leftover = await withPostgresUow(async (uow) => {
      const links = await uow.listLinksByCreator('creator_maya');
      return links.filter((l) => l.note === marker);
    });
    expect(leftover).toEqual([]);
  });

  it('create-checkout then capture posts one balanced journal in Postgres', async () => {
    const shareId = await withPostgresUow(async (uow) => {
      const link = await createTransactionLink(uow, {
        actor: creatorActor(),
        amountMinor: '5000',
        category: 'DIGITAL_SERVICE',
        deliveryDuration: 'PT48H',
      });
      return link.shareId;
    });

    const checkout = await withPostgresUow(async (uow) =>
      createCheckout(
        uow,
        { actor: publicActor(), shareId, idempotencyKey: `pg-${shareId}` },
        allow,
      ),
    );

    await withPostgresUow(async (uow) => {
      const event = capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: `pay_${checkout.transactionId}`,
        amount: money('5000'),
        occurredAt: uow.clock.now(),
        providerEventId: `evt_${checkout.transactionId}`,
      });
      const result = await processCanonicalProviderEvent(uow, uow.inbox, {
        actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'pg-cap' },
        event,
        signatureValid: true,
        transactionId: checkout.transactionId,
      });
      expect(result.applied).toBe(true);
    });

    const sql = getSql();
    const entries = await sql`
      SELECT id FROM ledger_entries WHERE source_id = ${checkout.transactionId} AND source_type = 'PAYMENT_CAPTURED'
    `;
    expect(entries).toHaveLength(1);
    const balanced = await withPostgresUow((uow) =>
      uow.journalIsBalanced(String((entries[0] as { id: string }).id)),
    );
    expect(balanced).toBe(true);
    const outbox = await sql`
      SELECT type FROM outbox_jobs WHERE payload->>'transactionId' = ${checkout.transactionId}
    `;
    expect(outbox.some((row) => (row as { type: string }).type === 'EMAIL_BUYER_RECEIPT')).toBe(
      true,
    );
    const audits = await sql`
      SELECT action FROM audit_events WHERE subject_id = ${checkout.transactionId} AND action = 'PAYMENT_CAPTURED'
    `;
    expect(audits.length).toBeGreaterThan(0);
  });
});
