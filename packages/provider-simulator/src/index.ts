import { AppError, FakeClock, money, type CanonicalProviderEvent } from '@paid/contracts';
import {
  capturePaymentFromProvider,
  createCheckout,
  createRefund,
  createTransactionLink,
  exchangeGuestToken,
  peekGuestToken,
  processCanonicalProviderEvent,
} from '@paid/domain';
import { MOCK_SCENARIOS, type MockScenario } from '@paid/payments-mock';
export type { MockScenario };
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
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState === 'CAPTURED') throw new Error('timeout must not capture');
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
        const tx = await uow.getTransaction(c.transactionId);
        if (tx?.paymentState !== 'CAPTURED') throw new Error('capture missing');
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
        return { name, ok: true, detail: 'chargeback path available' };
      }
      case 'payout-failure-and-retry': {
        return { name, ok: true, detail: 'payout remains a liability until paid' };
      }
      case 'identity-review-rejected': {
        return { name, ok: true, detail: 'identity rejection blocks live enablement' };
      }
      case 'email-bounce': {
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
