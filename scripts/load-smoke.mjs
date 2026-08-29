#!/usr/bin/env node
import { createCheckout, createTransactionLink } from '@paid/domain';
import { MemoryUnitOfWork, creatorActor, publicActor } from '@paid/test-support';

const allow = { outcome: 'ALLOW', reasons: [], policyVersion: 'compliance.v1.mock' };
const uow = new MemoryUnitOfWork();
const link = await createTransactionLink(uow, {
  actor: creatorActor(),
  amountMinor: '5000',
  category: 'DIGITAL_COMMISSION',
  deliveryDuration: 'PT48H',
});
const started = Date.now();
for (let i = 0; i < 25; i++) {
  try {
    await createCheckout(
      uow,
      { actor: publicActor(), shareId: link.shareId, idempotencyKey: `k${i}` },
      allow,
    );
  } catch {
    // reservation contention is expected after the first success
  }
}
const ms = Date.now() - started;
if (ms > 5000) {
  console.error(`load smoke too slow: ${ms}ms`);
  process.exit(1);
}
console.log(`load-smoke ok ${ms}ms`);
