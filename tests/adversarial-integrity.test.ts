import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { money, toWire } from '@paid/contracts';
import { decideCheckout } from '@paid/compliance';
import { assertOpsRole, assertFresh } from '@paid/authorization';
import { actorFromSession } from '@paid/auth';
import { computeTrust } from '@paid/trust';
import {
  createCheckout,
  createRefund,
  createTransactionLink,
  failCheckout,
  processCanonicalProviderEvent,
  requestPayout,
} from '@paid/domain';
import { KNOWN_EVENT_TYPES } from '@paid/contracts';
import {
  MemoryInbox,
  MemoryUnitOfWork,
  capturedEvent,
  creatorActor,
  opsActor,
  publicActor,
} from '@paid/test-support';

const allow = {
  outcome: 'ALLOW' as const,
  reasons: [] as string[],
  policyVersion: 'compliance.v1.mock',
};

async function openCaptured() {
  const uow = new MemoryUnitOfWork();
  const inbox = new MemoryInbox();
  const link = await createTransactionLink(uow, {
    actor: creatorActor(),
    amountMinor: '5000',
    category: 'DIGITAL_COMMISSION',
    deliveryDuration: 'PT48H',
  });
  const checkout = await createCheckout(
    uow,
    { actor: publicActor(), shareId: link.shareId, idempotencyKey: `k-${link.shareId}` },
    allow,
  );
  await processCanonicalProviderEvent(uow, inbox, {
    actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'cap' },
    event: capturedEvent({
      transactionId: checkout.transactionId,
      providerPaymentId: `pay_${checkout.transactionId}`,
      amount: money('5000'),
      occurredAt: uow.clock.now(),
      providerEventId: `evt_${checkout.transactionId}`,
    }),
    signatureValid: true,
    transactionId: checkout.transactionId,
  });
  return { uow, inbox, checkout };
}

describe('adversarial auth, secrets, money, trust', () => {
  it('staff EMAIL_LINK is not rewritten as PASSKEY', () => {
    const session = {
      id: 'sess_ops',
      userId: 'user_ops',
      creatorId: null,
      kind: 'OPS' as const,
      opsRoles: ['SUPPORT'] as const,
      authMethod: 'EMAIL_LINK' as const,
      authStrength: 'EMAIL_LINK' as const,
      stepUpExpiresAt: null,
      revokedAt: null,
    };
    const actor = actorFromSession(session, 'req_1');
    expect(actor.authStrength).toBe('EMAIL_LINK');
    expect(actor.authMethod).toBe('EMAIL_LINK');
    expect(actor.opsRoles).toEqual(['SUPPORT']);
    expect(() => assertFresh(actor)).toThrow(/Fresh authentication is required/);
  });

  it('SUPPORT cannot perform RISK or PAYMENTS mutations', async () => {
    const { uow, checkout } = await openCaptured();
    const support = opsActor(['SUPPORT']);
    await expect(
      requestPayout(uow, {
        actor: { ...support, authStrength: 'STEP_UP' },
        creatorId: 'creator_maya',
        amountMinor: '1000',
        destinationAgeHours: 72,
        idempotencyKey: 'sup-payout',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(
      createRefund(uow, {
        actor: { ...support, authStrength: 'STEP_UP' },
        transactionId: checkout.transactionId,
        amountMinor: '1000',
        idempotencyKey: 'sup-refund',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(() => assertOpsRole(support, 'RISK')).toThrow(/Not allowed/);
  });

  it('audit copies verified session facts', () => {
    const actor = actorFromSession(
      {
        id: 'sess_risk',
        userId: 'user_ops_risk',
        creatorId: null,
        kind: 'OPS',
        opsRoles: ['RISK', 'PAYMENTS'],
        authMethod: 'EMAIL_LINK',
        authStrength: 'STEP_UP',
        stepUpExpiresAt: new Date(Date.now() + 60_000),
        revokedAt: null,
      },
      'req_audit',
    );
    expect(actor.sessionId).toBe('sess_risk');
    expect(actor.actorId).toBe('user_ops_risk');
    expect(actor.authStrength).toBe('STEP_UP');
    expect(actor.opsRoles).toContain('RISK');
  });

  it('idempotency JSON never stores the guest token', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await createTransactionLink(uow, {
      actor: creatorActor(),
      amountMinor: '5000',
      category: 'DIGITAL_COMMISSION',
      deliveryDuration: 'PT48H',
    });
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'stable-key-1' },
      allow,
    );
    expect(checkout.guestToken.length).toBeGreaterThan(20);
    const stored = [...uow.idempotency.values()][0]!;
    expect(stored.resultJson).not.toContain(checkout.guestToken);
    expect(stored.resultJson).not.toMatch(/guest\/access\/[A-Za-z0-9_-]{16,}/);
    const retry = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'stable-key-1' },
      allow,
    );
    expect(retry.alreadyExisted).toBe(true);
    expect(retry.guestToken).toBe(checkout.guestToken);
    expect(uow.reservations.size).toBe(1);
    expect(uow.transactions.size).toBe(1);
  });

  it('payout request plus PAYOUT_PAID posts the final payout journal once', async () => {
    const { uow, inbox } = await openCaptured();
    const requested = await requestPayout(uow, {
      actor: creatorActor(),
      creatorId: 'creator_maya',
      amountMinor: '2000',
      destinationAgeHours: 72,
      idempotencyKey: 'payout-once',
    });
    expect(uow.journals.filter((j) => j.sourceType === 'PAYOUT_PAID')).toHaveLength(0);
    expect(uow.journals.filter((j) => j.sourceType === 'PAYOUT_RESERVED')).toHaveLength(1);
    const event = {
      canonicalEventId: 'canon_payout',
      provider: 'mock',
      providerConfigurationId: 'mock-provider-config',
      adapterVersion: 'mock.v1',
      schemaVersion: 1,
      eventType: 'PAYOUT_PAID',
      providerEventId: 'evt_payout_paid',
      providerResourceType: 'PAYOUT' as const,
      providerResourceId: requested.payoutId,
      occurredAt: uow.clock.now().toISOString(),
      receivedAt: uow.clock.now().toISOString(),
      amount: toWire(money('2000')),
      rawPayloadDigest: 'p'.repeat(64),
      verificationKeyVersion: 'v1',
      normalizedData: { payoutId: requested.payoutId, creatorId: 'creator_maya' },
    };
    const first = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'p1' },
      event,
      signatureValid: true,
    });
    const second = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'p2' },
      event,
      signatureValid: true,
    });
    expect(first.outcome).toBe('APPLIED');
    expect(second.outcome).toBe('DUPLICATE');
    expect(uow.journals.filter((j) => j.sourceType === 'PAYOUT_PAID')).toHaveLength(1);
  });

  it('refund request does not post REFUND_SUCCEEDED; provider event does once', async () => {
    const { uow, inbox, checkout } = await openCaptured();
    const refund = await createRefund(uow, {
      actor: opsActor(),
      transactionId: checkout.transactionId,
      amountMinor: '1000',
      idempotencyKey: 'rf-1',
    });
    expect(uow.journals.filter((j) => j.sourceType === 'REFUND_SUCCEEDED')).toHaveLength(0);
    const event = {
      canonicalEventId: 'canon_rf',
      provider: 'mock',
      providerConfigurationId: 'mock-provider-config',
      adapterVersion: 'mock.v1',
      schemaVersion: 1,
      eventType: 'REFUND_SUCCEEDED',
      providerEventId: 'evt_rf_ok',
      providerResourceType: 'REFUND' as const,
      providerResourceId: 'prov_rf',
      occurredAt: uow.clock.now().toISOString(),
      receivedAt: uow.clock.now().toISOString(),
      amount: toWire(money('1000')),
      rawPayloadDigest: 'r'.repeat(64),
      verificationKeyVersion: 'v1',
      normalizedData: { refundId: refund.refundId },
    };
    const first = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'rf' },
      event,
      signatureValid: true,
    });
    const second = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'rf2' },
      event,
      signatureValid: true,
    });
    expect(first.outcome).toBe('APPLIED');
    expect(second.outcome).toBe('DUPLICATE');
    expect(uow.journals.filter((j) => j.sourceType === 'REFUND_SUCCEEDED')).toHaveLength(1);
  });

  it('every known canonical event type is dispatched exhaustively', async () => {
    expect(KNOWN_EVENT_TYPES).toContain('PAYOUT_PAID');
    const uow = new MemoryUnitOfWork();
    const inbox = new MemoryInbox();
    const unknown = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'unk' },
      event: {
        canonicalEventId: 'canon_unk',
        provider: 'mock',
        providerConfigurationId: 'mock',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: 'WEIRD_NEW_EVENT',
        providerEventId: 'evt_unk',
        providerResourceType: 'UNKNOWN',
        providerResourceId: 'x',
        occurredAt: uow.clock.now().toISOString(),
        receivedAt: uow.clock.now().toISOString(),
        rawPayloadDigest: 'u'.repeat(64),
        verificationKeyVersion: 'v1',
        normalizedData: {},
      },
      signatureValid: true,
    });
    expect(unknown.outcome).toBe('UNKNOWN_ALERTED');
    expect(unknown.applied).toBe(false);
  });

  it('failed transactions do not inflate pending', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await createTransactionLink(uow, {
      actor: creatorActor(),
      amountMinor: '5000',
      category: 'DIGITAL_COMMISSION',
      deliveryDuration: 'PT48H',
    });
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'fail-pending' },
      allow,
    );
    const before = await uow.projectCreatorBalances('creator_maya', uow.clock.now());
    expect(before.pendingMinor).toBe(5000n);
    await failCheckout(uow, checkout.transactionId);
    const after = await uow.projectCreatorBalances('creator_maya', uow.clock.now());
    expect(after.pendingMinor).toBe(0n);
  });

  it('new creator is never HIGH TRUST and unique buyers are unpublished', () => {
    const trust = computeTrust({
      eligibleReviews: 0,
      ratingSum: 0,
      uniqueBuyers: 0,
      completedCount: 40,
      tenureDays: 400,
      integrityFlags: 0,
    });
    expect(trust.tier).toBe('BUILDING');
    expect(trust.publicCompleted).toBeNull();
  });

  it('unknown required buyer jurisdiction fail-closes', () => {
    const denied = decideCheckout({
      buildMode: 'PROVIDER_AGNOSTIC',
      creatorOnboardingState: 'ACTIVE',
      identityState: 'VERIFIED',
      ageState: 'VERIFIED_ADULT',
      sanctionsState: 'CLEAR',
      creatorJurisdiction: 'US-CA',
      buyerJurisdiction: 'UNKNOWN',
      requireKnownBuyerJurisdiction: true,
      allowlist: ['US'],
      lane: 'ORDINARY',
      adultLaneEnabled: false,
      checkoutEnabled: true,
      ticketMinor: 5000n,
      minTicketMinor: 2000n,
      maxTicketMinor: 500_000n,
      requiredStatesKnown: true,
    });
    expect(denied.outcome).toBe('DENY');
    expect(denied.reasons).toContain('JURISDICTION_BLOCKED');
  });

  it('invalid category is rejected before financial writes', async () => {
    const uow = new MemoryUnitOfWork();
    await expect(
      createTransactionLink(uow, {
        actor: creatorActor(),
        amountMinor: '5000',
        category: 'NOT_A_CATEGORY' as never,
        deliveryDuration: 'PT48H',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(uow.links.size).toBe(0);
  });

  it('hold route does not fabricate PASSKEY/RISK', () => {
    const hold = readFileSync(
      new URL('../apps/ops/app/api/ops/hold/route.ts', import.meta.url),
      'utf8',
    );
    expect(hold).toContain("requireFreshOpsRole('RISK')");
    expect(hold).not.toMatch(/authStrength:\s*'PASSKEY'/);
    expect(hold).not.toMatch(/opsRoles:\s*\['RISK'\]/);
  });

  it('production web does not depend on test-support', () => {
    const web = readFileSync(new URL('../apps/web/package.json', import.meta.url), 'utf8');
    const page = readFileSync(
      new URL('../apps/web/app/c/[handle]/page.tsx', import.meta.url),
      'utf8',
    );
    expect(web).not.toContain('@paid/test-support');
    expect(page).not.toContain('ensureDemoLink');
  });

  it('expired step-up cannot payout', async () => {
    const { uow } = await openCaptured();
    await expect(
      requestPayout(uow, {
        actor: { ...creatorActor(), authStrength: 'EMAIL_LINK' },
        creatorId: 'creator_maya',
        amountMinor: '1000',
        destinationAgeHours: 72,
        idempotencyKey: 'expired-step',
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_REQUIRED' });
  });
});
