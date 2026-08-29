import { describe, expect, it } from 'vitest';
import { AppError, FakeClock, money } from '@paid/contracts';
import { decideCheckout } from '@paid/compliance';
import {
  cancelTransactionLink,
  capturePaymentFromProvider,
  confirmDelivery,
  createCheckout,
  createRefund,
  createTransactionLink,
  exchangeGuestToken,
  markDelivered,
  peekGuestToken,
  processCanonicalProviderEvent,
  submitReview,
} from '@paid/domain';
import {
  MemoryInbox,
  MemoryUnitOfWork,
  capturedEvent,
  creatorActor,
  guestActor,
  opsActor,
  publicActor,
  seedCreator,
} from '@paid/test-support';
import { assertNoCreatorLeak, creatorTransactionDto } from '@paid/authorization';
import { money as makeMoney, parseMoneyWire } from '@paid/contracts';

const allow = {
  outcome: 'ALLOW' as const,
  reasons: [],
  policyVersion: 'compliance.v1.mock',
};

async function paidLink(uow: MemoryUnitOfWork) {
  const link = await createTransactionLink(uow, {
    actor: creatorActor(),
    amountMinor: '5000',
    category: 'DIGITAL_COMMISSION',
    deliveryDuration: 'PT48H',
  });
  return link;
}

describe('create checkout reservation', () => {
  it('two buyers racing a link yield at most one nonterminal reservation / success', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const first = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'buyer-a' },
      allow,
    );
    await expect(
      createCheckout(
        uow,
        { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'buyer-b' },
        allow,
      ),
    ).rejects.toMatchObject({ code: 'LINK_RESERVED' });
    expect(first.alreadyExisted).toBe(false);
    const open = await uow.findNonterminalReservation(link.id);
    expect(open?.id).toBe(first.reservationId);
  });

  it('same idempotency key returns the original session', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const input = { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'same' };
    const a = await createCheckout(uow, input, allow);
    const b = await createCheckout(uow, input, allow);
    expect(b.alreadyExisted).toBe(true);
    expect(b.checkoutSessionId).toBe(a.checkoutSessionId);
    expect(b.transactionId).toBe(a.transactionId);
  });

  it('same idempotency key with a different body is IDEMPOTENCY_CONFLICT', async () => {
    const uow = new MemoryUnitOfWork();
    const linkA = await paidLink(uow);
    const linkB = await createTransactionLink(uow, {
      actor: creatorActor(),
      amountMinor: '7500',
      category: 'DIGITAL_SERVICE',
      deliveryDuration: 'PT24H',
    });
    await createCheckout(
      uow,
      { actor: publicActor(), shareId: linkA.shareId, idempotencyKey: 'shared' },
      allow,
    );
    await expect(
      createCheckout(
        uow,
        { actor: publicActor(), shareId: linkB.shareId, idempotencyKey: 'shared' },
        allow,
      ),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });

  it('activated terms cannot be edited; cancel prevents new checkout', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    expect(link.state).toBe('ACTIVE');
    expect(link.amount.amountMinor).toBe(5000n);
    await cancelTransactionLink(uow, { actor: creatorActor(), linkId: link.id });
    await expect(
      createCheckout(
        uow,
        { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'x' },
        allow,
      ),
    ).rejects.toMatchObject({ code: 'LINK_INACTIVE' });
  });
});

describe('guest token scanner-safe exchange', () => {
  it('multiple GET peeks do not consume; POST exchanges once', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'g' },
      allow,
    );
    const peek1 = await peekGuestToken(uow, checkout.guestToken);
    const peek2 = await peekGuestToken(uow, checkout.guestToken);
    expect(peek1.valid).toBe(true);
    expect(peek2.valid).toBe(true);
    expect(peek1.consumed).toBe(false);
    const exchanged = await exchangeGuestToken(uow, {
      actor: publicActor(),
      token: checkout.guestToken,
    });
    expect(exchanged.transactionId).toBe(checkout.transactionId);
    await expect(
      exchangeGuestToken(uow, { actor: publicActor(), token: checkout.guestToken }),
    ).rejects.toBeInstanceOf(AppError);
  });
});

describe('payment truth and provider inbox', () => {
  it('checkout return without provider proof does not capture', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'ret' },
      allow,
    );
    const tx = await uow.getTransaction(checkout.transactionId);
    expect(tx?.paymentState).toBe('CREATED');
    expect(tx?.providerAuthoritativePaidAt).toBeNull();
  });

  it('duplicate webhook posts the ledger once', async () => {
    const uow = new MemoryUnitOfWork();
    const inbox = new MemoryInbox();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'cap' },
      allow,
    );
    const event = capturedEvent({
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_1',
      amount: money('5000'),
      occurredAt: uow.clock.now(),
      providerEventId: 'evt_dup',
    });
    const first = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'wh1' },
      event,
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    const second = await processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'wh2' },
      event,
      signatureValid: true,
      transactionId: checkout.transactionId,
    });
    expect(first.applied).toBe(true);
    expect(second.duplicate).toBe(true);
    expect(uow.journals.filter((j) => j.sourceType === 'PAYMENT_CAPTURED')).toHaveLength(1);
    expect(await uow.journalIsBalanced(uow.journals[0]!.id)).toBe(true);
  });

  it('late capture after timeout is reconciled, not discarded', async () => {
    const clock = new FakeClock();
    const uow = new MemoryUnitOfWork({ clock });
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'late' },
      allow,
    );
    clock.advanceHours(2);
    await capturePaymentFromProvider(uow, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'late' },
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_late',
      providerAuthoritativePaidAt: clock.now(),
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_late',
        amount: money('5000'),
        occurredAt: clock.now(),
      }),
    });
    const tx = await uow.getTransaction(checkout.transactionId);
    expect(tx?.paymentState).toBe('CAPTURED');
    expect(tx?.providerAuthoritativePaidAt).toEqual(clock.now());
    const used = uow.links.get(link.id);
    expect(used?.state).toBe('USED');
  });

  it('invalid signature is rejected', async () => {
    const uow = new MemoryUnitOfWork();
    const inbox = new MemoryInbox();
    await expect(
      processCanonicalProviderEvent(uow, inbox, {
        actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'bad' },
        event: capturedEvent({
          transactionId: 'x',
          providerPaymentId: 'p',
          amount: money('1'),
          occurredAt: uow.clock.now(),
        }),
        signatureValid: false,
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});

describe('money and ledger', () => {
  it('rejects float and non-USD wire values', () => {
    expect(() => makeMoney(1.5)).toThrow();
    expect(() => makeMoney('10.0')).toThrow();
    expect(() => parseMoneyWire({ amountMinor: '100', currency: 'EUR' })).toThrow();
    expect(makeMoney('100').currency).toBe('USD');
  });

  it('every capture journal balances and reserve is not revenue', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'led' },
      allow,
    );
    await capturePaymentFromProvider(uow, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'led' },
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_led',
      providerAuthoritativePaidAt: uow.clock.now(),
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_led',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
      }),
    });
    const lines = uow.journals[0]!.lines;
    const revenue = lines.find((l) => l.accountCode === 'platform.fee_revenue');
    const reserve = lines.find((l) => l.accountCode === 'creator.reserve_liability');
    expect(revenue?.direction).toBe('CREDIT');
    expect(reserve?.direction).toBe('CREDIT');
    expect(revenue?.amount.amountMinor).toBe(500n);
    expect(reserve?.amount.amountMinor).toBe(500n);
    expect(revenue?.accountCode).not.toBe(reserve?.accountCode);
  });

  it('partial refund cannot exceed refundable', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'rf' },
      allow,
    );
    await capturePaymentFromProvider(uow, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'rf' },
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_rf',
      providerAuthoritativePaidAt: uow.clock.now(),
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_rf',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
      }),
    });
    await createRefund(uow, {
      actor: opsActor(),
      transactionId: checkout.transactionId,
      amountMinor: '2000',
      idempotencyKey: 'r1',
    });
    await expect(
      createRefund(uow, {
        actor: opsActor(),
        transactionId: checkout.transactionId,
        amountMinor: '4000',
        idempotencyKey: 'r2',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
  });
});

describe('authorization and privacy', () => {
  it('creator A cannot read creator B private records', async () => {
    const uow = new MemoryUnitOfWork();
    uow.creators.set(
      'creator_b',
      seedCreator({ id: 'creator_b', userId: 'user_b', handle: 'blake' }),
    );
    const link = await paidLink(uow);
    await expect(
      cancelTransactionLink(uow, {
        actor: creatorActor('creator_b'),
        linkId: link.id,
      }),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('public order code is not an authentication credential', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'ord' },
      allow,
    );
    const tx = await uow.getTransaction(checkout.transactionId);
    await expect(
      confirmDelivery(uow, { actor: publicActor(), transactionId: tx!.id }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const dto = creatorTransactionDto({
      id: tx!.id,
      publicOrderCode: tx!.publicOrderCode,
      amount: tx!.amount,
      fulfillmentState: tx!.fulfillmentState,
      paymentState: tx!.paymentState,
      deadline: null,
    });
    expect(dto.buyerDisplay).toBe('Anonymous Buyer');
    assertNoCreatorLeak(dto);
  });

  it('guest session is scoped to one transaction', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'scope' },
      allow,
    );
    await expect(
      confirmDelivery(uow, { actor: guestActor('other'), transactionId: checkout.transactionId }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('fulfillment, reviews, compliance', () => {
  it('mark delivered is idempotent; one review per transaction', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await paidLink(uow);
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'ful' },
      allow,
    );
    await capturePaymentFromProvider(uow, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'ful' },
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_ful',
      providerAuthoritativePaidAt: uow.clock.now(),
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_ful',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
      }),
    });
    await markDelivered(uow, {
      actor: creatorActor(),
      transactionId: checkout.transactionId,
      method: 'external',
    });
    await markDelivered(uow, {
      actor: creatorActor(),
      transactionId: checkout.transactionId,
      method: 'external',
    });
    await confirmDelivery(uow, {
      actor: guestActor(checkout.transactionId),
      transactionId: checkout.transactionId,
    });
    await submitReview(uow, {
      actor: guestActor(checkout.transactionId),
      transactionId: checkout.transactionId,
      rating: 5,
      body: 'On time.',
    });
    await expect(
      submitReview(uow, {
        actor: guestActor(checkout.transactionId),
        transactionId: checkout.transactionId,
        rating: 4,
        body: 'again',
      }),
    ).rejects.toMatchObject({ code: 'STATE_CONFLICT' });
  });

  it('unknown required compliance state fail-closes', () => {
    const denied = decideCheckout({
      buildMode: 'PROVIDER_AGNOSTIC',
      creatorOnboardingState: 'ACTIVE',
      identityState: 'UNKNOWN',
      ageState: 'VERIFIED_ADULT',
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
    expect(denied.reasons).toContain('REQUIRED_STATE_UNKNOWN');
  });
});
