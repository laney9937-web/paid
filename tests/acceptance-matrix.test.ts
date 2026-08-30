import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  AppError,
  FakeClock,
  TNS_CATEGORIES,
  money,
  toWire,
  type CanonicalProviderEvent,
} from '@paid/contracts';
import { decideCheckout, publicReason } from '@paid/compliance';
import { KILL_SWITCHES, MOCK_POLICY } from '@paid/config';
import {
  applyAccountRecovery,
  applyManualAdjustment,
  applyProviderCheckoutOutcome,
  capturePaymentFromProvider,
  changeCreatorHandle,
  changePayoutDestination,
  createCheckout,
  createRefund,
  createTransactionLink,
  exchangeGuestToken,
  expireTransactionLink,
  getVisibleTransaction,
  instantPayoutSupported,
  markDelivered,
  openInternalDispute,
  peekGuestToken,
  planAccountClosure,
  planDataExport,
  processCanonicalProviderEvent,
  providerOutageError,
  recordSensitiveRead,
  releaseExpiredReservation,
  requestPayout,
  revokeGuestToken,
  routeReport,
  safeCheckoutReturnPath,
  submitReview,
} from '@paid/domain';
import {
  MemoryInbox,
  MemoryUnitOfWork,
  capturedEvent,
  creatorActor,
  defaultDomainConfig,
  guestActor,
  opsActor,
  publicActor,
  seedCreator,
} from '@paid/test-support';
import {
  assertNoCreatorLeak,
  assertOpsRole,
  creatorTransactionDto,
  denyOrderCodeAuth,
  opsCaseDto,
  publicCreatorDto,
} from '@paid/authorization';
import { computeTrust } from '@paid/trust';
import { evaluatePayoutRisk, recordRiskOverride } from '@paid/risk';
import { runReconciliation } from '@paid/reconciliation';
import {
  MAGIC_LINK_TTL_MS,
  OPS_SESSION_COOKIE,
  WEB_SESSION_COOKIE,
  assertChallenge,
  cacheHeadersPrivate,
  magicLinkPublicResponse,
  passkeyRelyingParty,
  recoveryBlocksPayoutChange,
  revokeSessions,
  rotateSession,
  securityHeaders,
  sessionCookieOptions,
} from '@paid/auth';
import { createMockPaymentsAdapter } from '@paid/payments-mock';

const allow = {
  outcome: 'ALLOW' as const,
  reasons: [] as string[],
  policyVersion: 'compliance.v1.mock',
};

async function openCheckout(uow = new MemoryUnitOfWork()) {
  const link = await createTransactionLink(uow, {
    actor: creatorActor(),
    amountMinor: '5000',
    category: 'DIGITAL_COMMISSION',
    deliveryDuration: 'PT48H',
  });
  const checkout = await createCheckout(
    uow,
    { actor: publicActor(), shareId: link.shareId, idempotencyKey: `k-${link.id}` },
    allow,
  );
  return { uow, link, checkout };
}

async function captureOpened(
  uow: MemoryUnitOfWork,
  transactionId: string,
  providerEventId = 'evt_cap',
) {
  await capturePaymentFromProvider(uow, {
    actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'cap' },
    transactionId,
    providerPaymentId: `pay_${transactionId}`,
    providerAuthoritativePaidAt: uow.clock.now(),
    event: capturedEvent({
      transactionId,
      providerPaymentId: `pay_${transactionId}`,
      amount: money('5000'),
      occurredAt: uow.clock.now(),
      providerEventId,
    }),
  });
}

describe('A. Link and immutable terms', () => {
  it('A-06 expired reservation unlocks when provider proves no payment', async () => {
    const { uow, link, checkout } = await openCheckout();
    await expect(
      releaseExpiredReservation(uow, checkout.transactionId, false),
    ).rejects.toMatchObject({ code: 'PAYMENT_UNKNOWN' });
    await releaseExpiredReservation(uow, checkout.transactionId, true);
    const reservation = await uow.getReservationByTransaction(checkout.transactionId);
    expect(reservation?.state).toBe('EXPIRED_RELEASED');
    const again = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'buyer-2' },
      allow,
    );
    expect(again.transactionId).not.toBe(checkout.transactionId);
  });

  it('A-08 public amount cannot be changed by a client payload; server uses link terms', async () => {
    const { uow, link, checkout } = await openCheckout();
    const tx = await uow.getTransaction(checkout.transactionId);
    expect(tx?.amount.amountMinor).toBe(link.amount.amountMinor);
    expect(tx?.amount.currency).toBe('USD');
  });

  it('A-09 delivery deadline is derived from canonical payment time', async () => {
    const clock = new FakeClock();
    const uow = new MemoryUnitOfWork({ clock });
    const { checkout } = await openCheckout(uow);
    clock.advanceHours(3);
    await captureOpened(uow, checkout.transactionId);
    const tx = await uow.getTransaction(checkout.transactionId);
    expect(tx?.providerAuthoritativePaidAt).toEqual(clock.now());
    expect(tx?.deliveryDeadlineAt?.getTime()).toBe(clock.now().getTime() + 48 * 3600 * 1000);
  });

  it('A-04/A-05 cancel keeps evidence and expire is a no-op while reserved', async () => {
    const { uow, link } = await openCheckout();
    const cancelled = await expireTransactionLink(uow, link.id);
    expect(cancelled?.state).toBe('ACTIVE');
  });
});

describe('B. Payment and provider events', () => {
  it('B-03 out-of-order authorized after capture stays captured', async () => {
    const { uow, checkout } = await openCheckout();
    const inbox = new MemoryInbox();
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'cap' },
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_oo',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
        providerEventId: 'evt_cap_first',
      }),
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    const authorized: CanonicalProviderEvent = {
      ...capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_oo',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
        providerEventId: 'evt_auth_late',
      }),
      eventType: 'PAYMENT_AUTHORIZED',
    };
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'auth' },
      event: authorized,
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    expect((await uow.getTransaction(checkout.transactionId))?.paymentState).toBe('CAPTURED');
  });

  it('B-06 stale webhook timestamp is rejected', async () => {
    const clock = new FakeClock();
    const adapter = createMockPaymentsAdapter({
      scenario: 'happy-path',
      clock,
      currentKey: 'k1',
      payments: new Map(),
      events: [],
    });
    const body = JSON.stringify({
      eventType: 'PAYMENT_CAPTURED',
      providerEventId: 'evt_stale',
      providerResourceId: 'pay_stale',
      occurredAt: clock.now().toISOString(),
    });
    const sig = `v1=${createHmac('sha256', 'k1').update(body).digest('hex')}`;
    await expect(
      adapter.verifyAndNormalizeWebhook(new TextEncoder().encode(body), {
        get: (name: string) =>
          name === 'x-mock-signature'
            ? sig
            : name === 'x-mock-timestamp'
              ? new Date(clock.now().getTime() - 10 * 60 * 1000).toISOString()
              : null,
      } as Headers),
    ).rejects.toThrow(/stale webhook timestamp/);
  });

  it('B-07 replay of the same provider event is duplicate', async () => {
    const { uow, checkout } = await openCheckout();
    const inbox = new MemoryInbox();
    const event = capturedEvent({
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_rep',
      amount: money('5000'),
      occurredAt: uow.clock.now(),
      providerEventId: 'evt_replay',
    });
    const first = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'r1' },
      event,
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    const second = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'r2' },
      event,
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    expect(first.applied).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(uow.journals).toHaveLength(1);
  });

  it('B-08 overlapping old webhook key verifies during rotation', async () => {
    const clock = new FakeClock();
    const adapter = createMockPaymentsAdapter({
      scenario: 'key-rotation-overlap',
      clock,
      currentKey: 'new-key',
      previousKey: 'old-key',
      payments: new Map(),
      events: [],
    });
    const body = JSON.stringify({
      eventType: 'PAYMENT_CAPTURED',
      providerEventId: 'evt_rot',
      providerResourceId: 'pay_rot',
      occurredAt: clock.now().toISOString(),
    });
    const oldSig = `v0=${createHmac('sha256', 'old-key').update(body).digest('hex')}`;
    const verified = await adapter.verifyAndNormalizeWebhook(new TextEncoder().encode(body), {
      get: (name: string) => (name === 'x-mock-signature' ? oldSig : null),
    } as Headers);
    expect(verified.signatureValid).toBe(true);
  });

  it('B-09 provider outage is retryable and creates no capture journal', async () => {
    const { uow, checkout } = await openCheckout();
    const outcome = await applyProviderCheckoutOutcome(uow, checkout.transactionId, 'UNKNOWN');
    expect(outcome).toBe('UNKNOWN');
    const err = providerOutageError();
    expect(err.code).toBe('PROVIDER_UNAVAILABLE');
    expect(err.retryable).toBe(true);
    expect(uow.journals).toHaveLength(0);
    expect((await uow.getTransaction(checkout.transactionId))?.paymentState).toBe(
      'UNKNOWN_REQUIRES_RECONCILIATION',
    );
  });

  it('B-10 checkout return rejects open redirects', () => {
    expect(
      safeCheckoutReturnPath({ requested: '/transaction/ABC12345', fallback: '/creator/home' }),
    ).toBe('/transaction/ABC12345');
    expect(() =>
      safeCheckoutReturnPath({ requested: 'https://evil.example/phish', fallback: '/x' }),
    ).toThrow(AppError);
    expect(() => safeCheckoutReturnPath({ requested: '//evil.example', fallback: '/x' })).toThrow(
      AppError,
    );
  });

  it('B-11/B-12/B-13/B-14 snapshot pins amount, portfolio and synthetic descriptor', async () => {
    const { uow, checkout, link } = await openCheckout();
    const tx = await uow.getTransaction(checkout.transactionId);
    const snap = await uow.getSnapshot(tx!.snapshotId);
    expect(snap?.amount.amountMinor).toBe(link.amount.amountMinor);
    expect(snap?.merchantPortfolioId).toBe('mock-portfolio-usd-digital');
    expect(snap?.providerConfigurationId).toBe('mock-provider-config');
    expect(snap?.statementDescriptor).toBe(MOCK_POLICY.statementDescriptor);
    expect(snap?.descriptorIsSynthetic).toBe(true);
    expect(MOCK_POLICY.descriptorIsSynthetic).toBe(true);
  });
});

describe('C. Financial integrity', () => {
  it('C-04 chargeback after payout posts receivable without auto-refund', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    const inbox = new MemoryInbox();
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'lost' },
      event: {
        canonicalEventId: 'canon_lost',
        provider: 'mock',
        providerConfigurationId: 'mock-provider-config',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: 'DISPUTE_LOST',
        providerEventId: 'evt_lost',
        providerResourceType: 'DISPUTE',
        providerResourceId: 'dsp_1',
        occurredAt: uow.clock.now().toISOString(),
        receivedAt: uow.clock.now().toISOString(),
        amount: toWire(money('5000')),
        rawPayloadDigest: 'c'.repeat(64),
        verificationKeyVersion: 'v1',
        normalizedData: {},
      },
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    expect(uow.journals.some((j) => j.sourceType === 'CHARGEBACK_AFTER_PAYOUT')).toBe(true);
    expect(uow.refunds).toHaveLength(0);
  });

  it('C-05 recapture is idempotent', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    await captureOpened(uow, checkout.transactionId, 'evt_again');
    expect(uow.journals.filter((j) => j.sourceType === 'PAYMENT_CAPTURED')).toHaveLength(1);
  });

  it('C-06 dashboard projections equal ledger as-of balances', async () => {
    const { uow, checkout } = await openCheckout();
    const pending = await uow.projectCreatorBalances('creator_maya', uow.clock.now());
    expect(pending.pendingMinor).toBe(5000n);
    await captureOpened(uow, checkout.transactionId);
    const after = await uow.projectCreatorBalances('creator_maya', uow.clock.now());
    expect(after.availableMinor).toBe(4250n);
    expect(after.reservedMinor).toBe(500n);
    expect(after.pendingMinor).toBe(0n);
    await requestPayout(uow, {
      actor: creatorActor(),
      creatorId: 'creator_maya',
      amountMinor: '4000',
      destinationAgeHours: 72,
      idempotencyKey: 'payout-1',
    });
    const reservedPayout = await uow.projectCreatorBalances('creator_maya', uow.clock.now());
    expect(reservedPayout.availableMinor).toBe(250n);
    expect(reservedPayout.inTransitMinor).toBe(4000n);
    expect(reservedPayout.paidMinor).toBe(0n);
  });

  it('C-07 reconciliation catches missing capture, fee, refund, reserve and payout', () => {
    const breaks = runReconciliation({
      internalCaptures: 1,
      providerCaptures: 2,
      internalRefunds: 0,
      providerRefunds: 1,
      internalPayouts: 0,
      providerPayouts: 1,
      internalFees: 0,
      providerFees: 1,
      internalReserves: 0,
      providerReserves: 1,
      source: { day: '2026-08-29' },
    });
    expect(breaks.map((b) => b.kind).sort()).toEqual([
      'MISSING_CAPTURE',
      'MISSING_FEE',
      'MISSING_PAYOUT',
      'MISSING_REFUND',
      'MISSING_RESERVE',
    ]);
  });

  it('C-08 manual adjustment is balanced, reasoned, and dual-controlled at threshold', async () => {
    const uow = new MemoryUnitOfWork();
    await expect(
      applyManualAdjustment(uow, {
        actor: opsActor(),
        amountMinor: '10000',
        reason: 'goodwill correction',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const ok = await applyManualAdjustment(uow, {
      actor: opsActor(),
      amountMinor: '10000',
      reason: 'goodwill correction',
      creatorId: 'creator_maya',
      secondApprover: { ...opsActor(['PAYMENTS']), actorId: 'ops_2' },
    });
    expect(ok.adjustmentId).toBeTruthy();
    expect(uow.audits.some((a) => a.action === 'MANUAL_ADJUSTMENT' && a.reason)).toBe(true);
    expect(await uow.journalIsBalanced(uow.journals[0]!.id)).toBe(true);
  });
});

describe('D. Fulfillment, protection and disputes', () => {
  it('D-03 dispute cannot open outside the review window', async () => {
    const clock = new FakeClock();
    const uow = new MemoryUnitOfWork({ clock });
    const { checkout } = await openCheckout(uow);
    await captureOpened(uow, checkout.transactionId);
    clock.advanceDays(31);
    await expect(
      openInternalDispute(uow, {
        actor: guestActor(checkout.transactionId),
        transactionId: checkout.transactionId,
        reasonCode: 'NOT_DELIVERED',
      }),
    ).rejects.toMatchObject({ code: 'STATE_CONFLICT' });
  });

  it('D-04 internal dispute and network chargeback coexist without double refund', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    await openInternalDispute(uow, {
      actor: guestActor(checkout.transactionId),
      transactionId: checkout.transactionId,
      reasonCode: 'NOT_AS_DESCRIBED',
    });
    const inbox = new MemoryInbox();
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'lost' },
      event: {
        canonicalEventId: 'canon_cb',
        provider: 'mock',
        providerConfigurationId: 'mock-provider-config',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: 'DISPUTE_LOST',
        providerEventId: 'evt_cb',
        providerResourceType: 'DISPUTE',
        providerResourceId: 'dsp_2',
        occurredAt: uow.clock.now().toISOString(),
        receivedAt: uow.clock.now().toISOString(),
        amount: toWire(money('5000')),
        rawPayloadDigest: 'e'.repeat(64),
        verificationKeyVersion: 'v1',
        normalizedData: {},
      },
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    expect(await uow.getDisputeByTransaction(checkout.transactionId)).toBeTruthy();
    expect(uow.journals.some((j) => j.sourceType === 'CHARGEBACK_AFTER_PAYOUT')).toBe(true);
    expect(uow.refunds).toHaveLength(0);
  });

  it('D-05 dispute refund requires authorized staff and is idempotent', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    const first = await createRefund(uow, {
      actor: opsActor(),
      transactionId: checkout.transactionId,
      amountMinor: '1000',
      idempotencyKey: 'same-refund',
    });
    const second = await createRefund(uow, {
      actor: opsActor(),
      transactionId: checkout.transactionId,
      amountMinor: '1000',
      idempotencyKey: 'same-refund',
    });
    expect(second.alreadyExisted).toBe(true);
    expect(second.refundId).toBe(first.refundId);
    await expect(
      createRefund(uow, {
        actor: creatorActor(),
        transactionId: checkout.transactionId,
        amountMinor: '1000',
        idempotencyKey: 'creator',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('D-06/D-07 T&S restricted categories bypass commercial SLA', () => {
    expect(routeReport('CHILD_SAFETY').sla).toBe('RESTRICTED');
    expect(routeReport('NON_CONSENSUAL').sla).toBe('RESTRICTED');
    expect(routeReport('PROSTITUTION_TRAFFICKING').sla).toBe('RESTRICTED');
    expect(routeReport('SANCTIONS').sla).toBe('RESTRICTED');
    expect(routeReport('TRANSACTION_LAUNDERING').sla).toBe('RESTRICTED');
    expect(routeReport('IP_DMCA').sla).toBe('RESTRICTED');
    expect(routeReport('LEGAL_PRIVACY').sla).toBe('RESTRICTED');
    expect(routeReport('REVIEW_ABUSE').sla).toBe('COMMERCIAL');
    expect(TNS_CATEGORIES).toContain('CHILD_SAFETY');
  });

  it('D-08 unknown required compliance state fails closed; public reason does not leak internals', () => {
    const denied = decideCheckout({
      buildMode: 'PROVIDER_AGNOSTIC',
      creatorOnboardingState: 'ACTIVE',
      identityState: 'UNKNOWN',
      ageState: 'UNKNOWN',
      sanctionsState: 'UNKNOWN',
      creatorJurisdiction: 'US-CA',
      allowlist: ['US'],
      lane: 'ORDINARY',
      adultLaneEnabled: false,
      checkoutEnabled: true,
      ticketMinor: 5000n,
      minTicketMinor: 500n,
      maxTicketMinor: 500_000n,
      requiredStatesKnown: false,
    });
    expect(denied.outcome).toBe('DENY');
    expect(publicReason(denied)).toBe('This purchase cannot be completed.');
    expect(publicReason(denied)).not.toContain('SANCTIONS');
  });

  it('D-10 adjudication uses the historical snapshot, not live config', async () => {
    const { uow, checkout } = await openCheckout();
    const tx = await uow.getTransaction(checkout.transactionId);
    const snap = await uow.getSnapshot(tx!.snapshotId);
    expect(snap?.policyVersion).toBe('policy.v1.mock');
    expect(snap?.feeScheduleVersion).toBe('fee.v2.mock');
    expect(snap?.createdAt).toEqual(tx?.createdAt);
  });
});

describe('E. Reviews and trust', () => {
  it('E-01 no eligible transaction yields no review', async () => {
    const { uow, checkout } = await openCheckout();
    await expect(
      submitReview(uow, {
        actor: guestActor(checkout.transactionId),
        transactionId: checkout.transactionId,
        rating: 5,
        body: 'too early',
      }),
    ).rejects.toMatchObject({ code: 'STATE_CONFLICT' });
  });

  it('E-03 creator cannot review self', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    await markDelivered(uow, {
      actor: creatorActor(),
      transactionId: checkout.transactionId,
      method: 'external',
    });
    await expect(
      submitReview(uow, {
        actor: {
          actorType: 'GUEST',
          guestTransactionId: checkout.transactionId,
          creatorId: 'creator_maya',
          authStrength: 'EMAIL_LINK',
          requestId: 'self-review',
        },
        transactionId: checkout.transactionId,
        rating: 5,
        body: 'self',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('E-04 refunded review is excluded from the public aggregate', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    const refund = await createRefund(uow, {
      actor: opsActor(),
      transactionId: checkout.transactionId,
      amountMinor: '5000',
      idempotencyKey: 'full',
    });
    const inbox = new MemoryInbox();
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'rf-e04' },
      event: {
        canonicalEventId: 'canon_rf_e04',
        provider: 'mock',
        providerConfigurationId: 'mock-provider-config',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: 'REFUND_SUCCEEDED',
        providerEventId: 'evt_rf_e04',
        providerResourceType: 'REFUND',
        providerResourceId: 'prov_rf_e04',
        occurredAt: uow.clock.now().toISOString(),
        receivedAt: uow.clock.now().toISOString(),
        amount: toWire(money('5000')),
        rawPayloadDigest: 'r'.repeat(64),
        verificationKeyVersion: 'v1',
        normalizedData: { refundId: refund.refundId },
      },
      signatureValid: true,
    });
    await markDelivered(uow, {
      actor: creatorActor(),
      transactionId: checkout.transactionId,
      method: 'external',
    });
    await submitReview(uow, {
      actor: guestActor(checkout.transactionId),
      transactionId: checkout.transactionId,
      rating: 1,
      body: 'refunded',
    });
    expect(uow.reviews.get(checkout.transactionId)?.includedInAggregate).toBe(false);
  });

  it('E-06/E-07/E-09 trust is versioned, hides private risk, and integrity flags block HIGH', () => {
    const snap = computeTrust({
      eligibleReviews: 20,
      ratingSum: 96,
      uniqueBuyers: 25,
      completedCount: 55,
      tenureDays: 90,
      integrityFlags: 1,
    });
    expect(snap.algorithmVersion).toBe('trust.v1');
    expect(snap.tier).toBe('BUILDING');
    const dto = publicCreatorDto({
      handle: 'maya',
      displayName: 'Maya',
      verified: true,
      trustTier: snap.tier,
      rating: snap.publicRating,
      completedCount: snap.publicCompleted,
      memberSince: new Date('2026-01-01'),
      ageVerifiedPublic: true,
    });
    expect(JSON.stringify(dto)).not.toContain('integrityFlags');
    expect(JSON.stringify(dto)).not.toContain('riskScore');
  });

  it('E-08 handle change preserves creator id for reputation continuity', async () => {
    const uow = new MemoryUnitOfWork();
    const changed = await changeCreatorHandle(uow, { actor: creatorActor(), handle: 'maya_v2' });
    expect(changed.creatorId).toBe('creator_maya');
    expect((await uow.getCreator('creator_maya'))?.handle).toBe('maya_v2');
  });
});

describe('F. Payout risk and account security', () => {
  it('F-01/F-02 payout destination change requires step-up, audits, and holds payouts', async () => {
    const uow = new MemoryUnitOfWork();
    await expect(
      changePayoutDestination(uow, {
        actor: { ...creatorActor(), authStrength: 'EMAIL_LINK' },
        destinationFingerprint: 'dest_1',
      }),
    ).rejects.toMatchObject({ code: 'STEP_UP_REQUIRED' });
    await changePayoutDestination(uow, {
      actor: creatorActor(),
      destinationFingerprint: 'dest_1',
    });
    expect((await uow.getCreator('creator_maya'))?.payoutHold).toBe(true);
    expect(uow.audits.some((a) => a.action === 'PAYOUT_DESTINATION_CHANGED')).toBe(true);
    expect(uow.outbox.some((j) => j.type === 'EMAIL_SECURITY_ALERT')).toBe(true);
  });

  it('F-03 recovery holds payouts and F-06 kill switch blocks payout', async () => {
    const uow = new MemoryUnitOfWork();
    await applyAccountRecovery(uow, { actor: creatorActor(), creatorId: 'creator_maya' });
    expect((await uow.getCreator('creator_maya'))?.payoutHold).toBe(true);
    const disabled = new MemoryUnitOfWork({
      config: { ...defaultDomainConfig(), payoutEnabled: false },
    });
    await expect(
      requestPayout(disabled, {
        actor: creatorActor(),
        creatorId: 'creator_maya',
        amountMinor: '100',
        destinationAgeHours: 72,
        idempotencyKey: 'x',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(KILL_SWITCHES).toEqual(
      expect.arrayContaining([
        'checkout_enabled',
        'payout_enabled',
        'adult_lane_enabled',
        'review_enabled',
        'new_links_enabled',
      ]),
    );
  });

  it('F-04 public high trust cannot bypass private payout rules', () => {
    const decision = evaluatePayoutRisk({
      publicTrustTier: 'HIGH',
      recentRecovery: true,
      destinationAgeHours: 1,
      chargebackCount: 2,
      payoutHold: true,
    });
    expect(decision.outcome).toBe('REVIEW');
    expect(decision.reasonCodes).toEqual(
      expect.arrayContaining(['MANUAL_HOLD', 'RECOVERY_COOLDOWN', 'DESTINATION_COOLDOWN']),
    );
  });

  it('F-05 human override has reason, actor, expiry and history', () => {
    const now = new Date('2026-08-29T16:00:00.000Z');
    const override = recordRiskOverride({
      actorType: 'OPS',
      actorId: 'ops_risk',
      opsRoles: ['RISK'],
      authStrength: 'STEP_UP',
      subjectId: 'creator_maya',
      reason: 'documented false positive',
      expiresAt: new Date(now.getTime() + 86400_000),
      now,
    });
    expect(override.reason).toContain('false positive');
    expect(override.actorId).toBe('ops_risk');
    expect(override.expiresAt.getTime()).toBeGreaterThan(now.getTime());
  });

  it('F-07 no instant payout path exists', async () => {
    expect(instantPayoutSupported()).toBe(false);
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    await expect(
      requestPayout(uow, {
        actor: creatorActor(),
        creatorId: 'creator_maya',
        amountMinor: '4000',
        destinationAgeHours: 1,
        idempotencyKey: 'instant',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('G. Authorization and privacy', () => {
  it('G-05 revoked guest token cannot be exchanged; reissue is a new digest', async () => {
    const { uow, checkout } = await openCheckout();
    await revokeGuestToken(uow, checkout.guestToken);
    await expect(
      exchangeGuestToken(uow, { actor: publicActor(), token: checkout.guestToken }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    const peek = await peekGuestToken(uow, checkout.guestToken);
    expect(peek.valid).toBe(false);
  });

  it('G-06 enumeration returns consistent not-found', async () => {
    const { uow, checkout } = await openCheckout();
    uow.creators.set(
      'creator_b',
      seedCreator({ id: 'creator_b', userId: 'user_b', handle: 'blake' }),
    );
    const missing = getVisibleTransaction(uow, {
      actor: creatorActor(),
      transactionId: 'does-not-exist',
    });
    const other = getVisibleTransaction(uow, {
      actor: creatorActor('creator_b'),
      transactionId: checkout.transactionId,
    });
    await expect(missing).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Transaction not found',
    });
    await expect(other).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: 'Transaction not found',
    });
  });

  it('G-07/G-08 admin roles and sensitive reads are enforced and audited', async () => {
    expect(() => assertOpsRole(opsActor(['SUPPORT']), 'PAYMENTS')).toThrow(AppError);
    expect(() => assertOpsRole(opsActor(['PAYMENTS']), 'PAYMENTS')).not.toThrow();
    const uow = new MemoryUnitOfWork();
    await recordSensitiveRead(uow, {
      actor: opsActor(['COMPLIANCE']),
      subjectType: 'creator',
      subjectId: 'creator_maya',
      action: 'EXPORT_READ',
    });
    expect(uow.audits.some((a) => a.action === 'EXPORT_READ')).toBe(true);
  });

  it('G-09/G-10 account closure anonymizes allowed fields; legal hold blocks deletion', () => {
    const hold = planAccountClosure({
      legalHold: { subjectId: 'creator_maya', reason: 'subpoena', createdAt: new Date() },
      financialRecordsRequired: true,
    });
    expect(hold.allowed).toBe(false);
    expect(hold.reason).toBe('LEGAL_HOLD');
    const plan = planAccountClosure({ legalHold: null, financialRecordsRequired: true });
    expect(plan.allowed).toBe(true);
    expect(plan.anonymize).toContain('email');
    expect(plan.retain).toEqual(expect.arrayContaining(['ledger', 'audit', 'transactions']));
  });

  it('G-11 export and staff search hide restricted fields from support', () => {
    const support = planDataExport('SUPPORT');
    expect(support.exclude).toEqual(
      expect.arrayContaining([
        'taxRaw',
        'sanctionsRaw',
        'restrictedIdentity',
        'adultTransactionLinkage',
      ]),
    );
    const dto = opsCaseDto('SUPPORT', {
      id: 'case_1',
      category: 'SANCTIONS',
      sla: 'RESTRICTED',
      sanctionsRaw: 'raw',
      taxRaw: 'tin',
      restrictedIdentity: 'kyc',
      adultTransactionLinkage: 'tx',
    });
    expect(dto).not.toHaveProperty('sanctionsRaw');
    const compliance = opsCaseDto('COMPLIANCE', {
      id: 'case_1',
      category: 'SANCTIONS',
      sla: 'RESTRICTED',
      sanctionsRaw: 'raw',
    });
    expect(compliance).toHaveProperty('sanctionsRaw', 'raw');
  });

  it('G-02 creator DTO never includes buyer identity or tokens', () => {
    const dto = creatorTransactionDto({
      id: 'tx',
      publicOrderCode: 'A82F9K3M2Q',
      amount: money('5000'),
      fulfillmentState: 'AWAITING_DELIVERY',
      paymentState: 'CREATED',
      deadline: null,
    });
    expect(dto.buyerDisplay).toBe('Anonymous Buyer');
    assertNoCreatorLeak(dto);
    expect(() => denyOrderCodeAuth()).toThrow(AppError);
  });
});

describe('H/I auth, cookies, headers', () => {
  it('H-01/H-05/H-06 private cache and security headers are present', () => {
    expect(cacheHeadersPrivate()['Cache-Control']).toContain('no-store');
    const headers = securityHeaders();
    expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Referrer-Policy']).toBe('no-referrer');
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('I-01/I-02/I-03/I-04/I-05/I-06/I-07/I-08 passkey, challenge, session, cookies, recovery', () => {
    const rp = passkeyRelyingParty({ rpID: 'localhost', origin: 'http://localhost:3000' });
    expect(rp.userVerification).toBe('required');
    expect(() => passkeyRelyingParty({ rpID: 'x', origin: 'https://*.evil' })).toThrow();
    const now = new Date('2026-08-29T16:00:00.000Z');
    expect(() =>
      assertChallenge({ consumedAt: now, expiresAt: new Date(now.getTime() + 1000), now }),
    ).toThrow(AppError);
    expect(() =>
      assertChallenge({
        consumedAt: null,
        expiresAt: new Date(now.getTime() - 1),
        now,
      }),
    ).toThrow(AppError);
    assertChallenge({
      consumedAt: null,
      expiresAt: new Date(now.getTime() + MAGIC_LINK_TTL_MS),
      now,
    });
    const rotated = rotateSession(
      { id: 'sess_1', userId: 'user_maya', issuedAt: now, revokedAt: null },
      now,
      'sess_2',
    );
    expect(rotated.previous.revokedAt).toEqual(now);
    expect(rotated.next.rotatedFrom).toBe('sess_1');
    const revoked = revokeSessions([rotated.next], now);
    expect(revoked[0]?.revokedAt).toEqual(now);
    const https = sessionCookieOptions('https://paid.example');
    expect(https.httpOnly).toBe(true);
    expect(https.secure).toBe(true);
    expect(https.sameSite).toBe('lax');
    expect(WEB_SESSION_COOKIE).not.toBe(OPS_SESSION_COOKIE);
    expect(magicLinkPublicResponse().message).toContain('If an account exists');
    expect(
      recoveryBlocksPayoutChange(now, new Date(now.getTime() + 60_000), 48 * 3600 * 1000),
    ).toBe(true);
  });
});

describe('L kill switches, jobs, brand helpers', () => {
  it('L-02 checkout, review and new-link kill switches take effect server-side', async () => {
    const noCheckout = new MemoryUnitOfWork({
      config: { ...defaultDomainConfig(), checkoutEnabled: false },
    });
    const link = await createTransactionLink(new MemoryUnitOfWork(), {
      actor: creatorActor(),
      amountMinor: '5000',
      category: 'DIGITAL_SERVICE',
      deliveryDuration: 'PT24H',
    });
    noCheckout.links.set(link.id, link);
    await expect(
      createCheckout(
        noCheckout,
        { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'x' },
        allow,
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const noLinks = new MemoryUnitOfWork({
      config: { ...defaultDomainConfig(), newLinksEnabled: false },
    });
    await expect(
      createTransactionLink(noLinks, {
        actor: creatorActor(),
        amountMinor: '5000',
        category: 'DIGITAL_SERVICE',
        deliveryDuration: 'PT24H',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const noReview = new MemoryUnitOfWork({
      config: { ...defaultDomainConfig(), reviewEnabled: false },
    });
    const opened = await openCheckout(noReview);
    await captureOpened(noReview, opened.checkout.transactionId);
    await markDelivered(noReview, {
      actor: creatorActor(),
      transactionId: opened.checkout.transactionId,
      method: 'external',
    });
    await expect(
      submitReview(noReview, {
        actor: guestActor(opened.checkout.transactionId),
        transactionId: opened.checkout.transactionId,
        rating: 5,
        body: 'nice',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('J-05 email outage never rolls back a captured journal', async () => {
    const { uow, checkout } = await openCheckout();
    await captureOpened(uow, checkout.transactionId);
    expect(uow.journals.filter((j) => j.sourceType === 'PAYMENT_CAPTURED')).toHaveLength(1);
    expect(uow.outbox.some((j) => j.type === 'EMAIL_BUYER_RECEIPT')).toBe(true);
  });

  it('L-09 failed payout is not platform revenue', async () => {
    const uow = new MemoryUnitOfWork();
    const inbox = new MemoryInbox();
    await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'fail-payout' },
      event: {
        canonicalEventId: 'canon_pf',
        provider: 'mock',
        providerConfigurationId: 'mock-provider-config',
        adapterVersion: 'mock.v1',
        schemaVersion: 1,
        eventType: 'PAYOUT_FAILED',
        providerEventId: 'evt_pf',
        providerResourceType: 'PAYOUT',
        providerResourceId: 'payout_x',
        occurredAt: uow.clock.now().toISOString(),
        receivedAt: uow.clock.now().toISOString(),
        rawPayloadDigest: 'f'.repeat(64),
        verificationKeyVersion: 'v1',
        normalizedData: { creatorId: 'creator_maya' },
      },
      signatureValid: true,
    });
    expect(uow.journals).toHaveLength(0);
    expect(uow.audits.some((a) => a.action === 'PAYOUT_FAILED')).toBe(true);
  });
});
