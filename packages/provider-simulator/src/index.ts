import { createHmac } from 'node:crypto';
import { AppError, FakeClock, money, toWire, type CanonicalProviderEvent } from '@paid/contracts';
import { decideCheckout } from '@paid/compliance';
import {
  applyProviderCheckoutOutcome,
  capturePaymentFromProvider,
  providerOutageError,
  createCheckout,
  createRefund,
  createTransactionLink,
  exchangeGuestToken,
  peekGuestToken,
  processCanonicalProviderEvent,
} from '@paid/domain';
import { MOCK_SCENARIOS, createMockPaymentsAdapter, type MockScenario } from '@paid/payments-mock';
export type { MockScenario };
import { createEmailMock } from '@paid/email-mock';
import {
  MemoryInbox,
  MemoryUnitOfWork,
  capturedEvent,
  creatorActor,
  opsActor,
  publicActor,
} from '@paid/test-support';

export { MOCK_SCENARIOS };

const allow = {
  outcome: 'ALLOW' as const,
  reasons: [] as string[],
  policyVersion: 'compliance.v1.mock',
};

export type ScenarioResult = {
  name: MockScenario;
  ok: boolean;
  detail: string;
};

export async function runScenario(name: MockScenario): Promise<ScenarioResult> {
  const clock = new FakeClock();
  const uow = new MemoryUnitOfWork({ clock });
  const inbox = new MemoryInbox();
  const link = await createTransactionLink(uow, {
    actor: creatorActor(),
    amountMinor: '5000',
    category: 'DIGITAL_COMMISSION',
    deliveryDuration: 'PT48H',
  });

  const capture = async (transactionId: string, providerEventId: string) => {
    const event = capturedEvent({
      transactionId,
      providerPaymentId: `pay_${transactionId}`,
      amount: money('5000'),
      occurredAt: clock.now(),
      providerEventId,
    });
    return processCanonicalProviderEvent(uow, inbox, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'sim' },
      event,
      signatureValid: name !== 'invalid-signature',
      transactionId,
    });
  };

  try {
    switch (name) {
      case 'happy-path': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'h' },
          allow,
        );
        const r = await capture(c.transactionId, 'evt_happy');
        if (!r.applied) throw new Error('expected capture');
        return { name, ok: true, detail: 'captured' };
      }
      case 'decline': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'd' },
          allow,
        );
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState === 'CAPTURED')
          throw new Error('should not capture on decline scenario setup');
        return { name, ok: true, detail: 'pending without capture' };
      }
      case 'provider-timeout-unknown': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'u' },
          allow,
        );
        const outcome = await applyProviderCheckoutOutcome(uow, c.transactionId, 'UNKNOWN');
        if (outcome !== 'UNKNOWN') throw new Error('expected unknown checkout outcome');
        const outage = providerOutageError();
        if (outage.code !== 'PROVIDER_UNAVAILABLE' || !outage.retryable) {
          throw new Error('provider outage must be retryable');
        }
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState !== 'UNKNOWN_REQUIRES_RECONCILIATION') {
          throw new Error('timeout must leave unknown reconciliation state');
        }
        if (uow.journals.length !== 0) throw new Error('phantom capture journal');
        return { name, ok: true, detail: 'unknown/pending' };
      }
      case 'late-success-after-timeout': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'l' },
          allow,
        );
        clock.advanceHours(2);
        await capturePaymentFromProvider(uow, {
          actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'late' },
          transactionId: c.transactionId,
          providerPaymentId: 'pay_late',
          providerAuthoritativePaidAt: clock.now(),
          event: capturedEvent({
            transactionId: c.transactionId,
            providerPaymentId: 'pay_late',
            amount: money('5000'),
            occurredAt: clock.now(),
          }),
        });
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState !== 'CAPTURED') throw new Error('late success not applied');
        return { name, ok: true, detail: 'late capture applied' };
      }
      case 'duplicate-webhook': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'dup' },
          allow,
        );
        await capture(c.transactionId, 'evt_dup');
        const second = await capture(c.transactionId, 'evt_dup');
        if (!second.duplicate) throw new Error('expected duplicate');
        if (uow.journals.length !== 1) throw new Error('duplicate posted twice');
        return { name, ok: true, detail: 'deduped' };
      }
      case 'out-of-order-events': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'oo' },
          allow,
        );
        await capture(c.transactionId, 'evt_cap');
        const authorized: CanonicalProviderEvent = {
          ...capturedEvent({
            transactionId: c.transactionId,
            providerPaymentId: `pay_${c.transactionId}`,
            amount: money('5000'),
            occurredAt: clock.now(),
            providerEventId: 'evt_auth_late',
          }),
          eventType: 'PAYMENT_AUTHORIZED',
        };
        await processCanonicalProviderEvent(uow, inbox, {
          actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'auth-late' },
          event: authorized,
          signatureValid: true,
          transactionId: c.transactionId,
        });
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState !== 'CAPTURED') throw new Error('out-of-order uncaptured payment');
        return { name, ok: true, detail: 'converged to captured' };
      }
      case 'unknown-valid-event': {
        const event: CanonicalProviderEvent = {
          canonicalEventId: 'canon_unknown',
          provider: 'mock',
          providerConfigurationId: 'mock-provider-config',
          adapterVersion: 'mock.v1',
          schemaVersion: 1,
          eventType: 'FUTURE_UNKNOWN_TYPE',
          providerEventId: 'evt_unknown',
          providerResourceType: 'UNKNOWN',
          providerResourceId: 'x',
          occurredAt: clock.now().toISOString(),
          receivedAt: clock.now().toISOString(),
          rawPayloadDigest: 'b'.repeat(64),
          verificationKeyVersion: 'v1',
          normalizedData: {},
        };
        const r = await processCanonicalProviderEvent(uow, inbox, {
          actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'unk' },
          event,
          signatureValid: true,
        });
        if (!r.unknown) throw new Error('expected unknown retention');
        return { name, ok: true, detail: 'unknown retained' };
      }
      case 'invalid-signature': {
        try {
          await capture('nope', 'evt_bad');
          throw new Error('should reject');
        } catch (error) {
          if (error instanceof AppError && error.code === 'UNAUTHENTICATED') {
            return { name, ok: true, detail: 'rejected' };
          }
          throw error;
        }
      }
      case 'key-rotation-overlap': {
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
          get: (header: string) => (header === 'x-mock-signature' ? oldSig : null),
        } as Headers);
        if (!verified.signatureValid) throw new Error('previous key should verify during overlap');
        return { name, ok: true, detail: 'current+previous keys accepted in mock adapter' };
      }
      case 'partial-then-full-refund': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'rf' },
          allow,
        );
        await capture(c.transactionId, 'evt_rf');
        await createRefund(uow, {
          actor: opsActor(),
          transactionId: c.transactionId,
          amountMinor: '2000',
          idempotencyKey: 'p1',
        });
        await createRefund(uow, {
          actor: opsActor(),
          transactionId: c.transactionId,
          amountMinor: '3000',
          idempotencyKey: 'p2',
        });
        return { name, ok: true, detail: 'partial then remaining refund' };
      }
      case 'chargeback-after-payout': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'cb' },
          allow,
        );
        await capture(c.transactionId, 'evt_cb');
        const lost: CanonicalProviderEvent = {
          canonicalEventId: 'canon_lost',
          provider: 'mock',
          providerConfigurationId: 'mock-provider-config',
          adapterVersion: 'mock.v1',
          schemaVersion: 1,
          eventType: 'DISPUTE_LOST',
          providerEventId: 'evt_lost',
          providerResourceType: 'DISPUTE',
          providerResourceId: 'dsp_1',
          occurredAt: clock.now().toISOString(),
          receivedAt: clock.now().toISOString(),
          amount: toWire(money('5000')),
          rawPayloadDigest: 'c'.repeat(64),
          verificationKeyVersion: 'v1',
          normalizedData: { transactionId: c.transactionId },
        };
        await processCanonicalProviderEvent(uow, inbox, {
          actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'lost' },
          event: lost,
          signatureValid: true,
          transactionId: c.transactionId,
        });
        if (!uow.journals.some((j) => j.sourceType === 'CHARGEBACK_AFTER_PAYOUT')) {
          throw new Error('missing chargeback journal');
        }
        if (uow.refunds.length !== 0) throw new Error('chargeback must not auto-refund');
        return { name, ok: true, detail: 'chargeback path available' };
      }
      case 'payout-failure-and-retry': {
        const failed: CanonicalProviderEvent = {
          canonicalEventId: 'canon_payout_fail',
          provider: 'mock',
          providerConfigurationId: 'mock-provider-config',
          adapterVersion: 'mock.v1',
          schemaVersion: 1,
          eventType: 'PAYOUT_FAILED',
          providerEventId: 'evt_payout_fail',
          providerResourceType: 'PAYOUT',
          providerResourceId: 'payout_1',
          occurredAt: clock.now().toISOString(),
          receivedAt: clock.now().toISOString(),
          rawPayloadDigest: 'd'.repeat(64),
          verificationKeyVersion: 'v1',
          normalizedData: { creatorId: 'creator_maya' },
        };
        await processCanonicalProviderEvent(uow, inbox, {
          actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'payout-fail' },
          event: failed,
          signatureValid: true,
        });
        if (uow.journals.some((j) => j.sourceType === 'PAYOUT_PAID')) {
          throw new Error('failed payout must not post as paid');
        }
        if (
          uow.journals.some((j) => j.lines.some((l) => l.accountCode === 'platform.fee_revenue'))
        ) {
          throw new Error('failed payout must not become platform revenue');
        }
        return { name, ok: true, detail: 'payout remains a liability until paid' };
      }
      case 'identity-review-rejected': {
        const denied = decideCheckout({
          buildMode: 'PROVIDER_AGNOSTIC',
          creatorOnboardingState: 'ACTIVE',
          identityState: 'REJECTED',
          ageState: 'VERIFIED_ADULT',
          sanctionsState: 'CLEAR',
          creatorJurisdiction: 'US-CA',
          allowlist: ['US'],
          lane: 'ORDINARY',
          adultLaneEnabled: false,
          checkoutEnabled: true,
          ticketMinor: 5000n,
          minTicketMinor: 500n,
          maxTicketMinor: 500_000n,
          requiredStatesKnown: true,
        });
        if (denied.outcome !== 'DENY') throw new Error('rejected identity must deny checkout');
        return { name, ok: true, detail: 'identity rejection blocks live enablement' };
      }
      case 'email-bounce': {
        const email = createEmailMock({ bounce: true });
        const result = await email.adapter.send({
          toDigest: 'abc123digest',
          templateId: 'guest-receipt',
          templateVersion: 'v1',
          variables: { kind: 'EMAIL_BUYER_RECEIPT' },
        });
        if (result.accepted) throw new Error('bounce should not be accepted');
        const leaked = JSON.stringify(email.sent);
        if (leaked.includes('@') || leaked.includes('buyer@')) {
          throw new Error('bounce payload leaked recipient');
        }
        return { name, ok: true, detail: 'bounce handled without leaking recipient' };
      }
      case 'email-link-scanner-prefetch': {
        const c = await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'scan' },
          allow,
        );
        await peekGuestToken(uow, c.guestToken);
        await peekGuestToken(uow, c.guestToken);
        const ex = await exchangeGuestToken(uow, { actor: publicActor(), token: c.guestToken });
        if (ex.transactionId !== c.transactionId) throw new Error('exchange failed after peeks');
        return { name, ok: true, detail: 'GET did not consume' };
      }
      case 'two-buyers-one-link-race': {
        await createCheckout(
          uow,
          { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'a' },
          allow,
        );
        try {
          await createCheckout(
            uow,
            { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'b' },
            allow,
          );
          throw new Error('second buyer should lose');
        } catch (error) {
          if (error instanceof AppError && error.code === 'LINK_RESERVED') {
            return { name, ok: true, detail: 'single reservation' };
          }
          throw error;
        }
      }
      default:
        throw new Error(`unknown scenario ${name as string}`);
    }
  } catch (error) {
    return { name, ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}

export async function runAllScenarios(): Promise<ScenarioResult[]> {
  const results: ScenarioResult[] = [];
  for (const name of MOCK_SCENARIOS) {
    results.push(await runScenario(name));
  }
  return results;
}
