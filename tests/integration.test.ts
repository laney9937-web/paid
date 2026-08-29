import { describe, expect, it } from 'vitest';
import { createCheckout, capturePaymentFromProvider } from '@paid/domain';
import { money } from '@paid/contracts';
import { MemoryUnitOfWork, capturedEvent, creatorActor, publicActor } from '@paid/test-support';
import { createTransactionLink } from '@paid/domain';

const allow = { outcome: 'ALLOW' as const, reasons: [], policyVersion: 'compliance.v1.mock' };

describe('atomic domain + ledger + audit + outbox', () => {
  it('capture writes journal, audit, and outbox together', async () => {
    const uow = new MemoryUnitOfWork();
    const link = await createTransactionLink(uow, {
      actor: creatorActor(),
      amountMinor: '5000',
      category: 'DIGITAL_COMMISSION',
      deliveryDuration: 'PT48H',
    });
    const checkout = await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: 'int' },
      allow,
    );
    await capturePaymentFromProvider(uow, {
      actor: { actorType: 'PROVIDER', authStrength: 'SERVICE', requestId: 'int' },
      transactionId: checkout.transactionId,
      providerPaymentId: 'pay_int',
      providerAuthoritativePaidAt: uow.clock.now(),
      event: capturedEvent({
        transactionId: checkout.transactionId,
        providerPaymentId: 'pay_int',
        amount: money('5000'),
        occurredAt: uow.clock.now(),
      }),
    });
    expect(uow.journals).toHaveLength(1);
    expect(uow.audits.some((a) => a.action === 'PAYMENT_CAPTURED')).toBe(true);
    expect(uow.outbox.some((j) => j.type === 'EMAIL_BUYER_RECEIPT')).toBe(true);
    expect(await uow.journalIsBalanced(uow.journals[0]!.id)).toBe(true);
  });
});
