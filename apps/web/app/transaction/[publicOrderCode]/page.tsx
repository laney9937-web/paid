import { cookies } from 'next/headers';
import { formatUsd } from '@paid/contracts';
import { GUEST_SESSION_COOKIE } from '@paid/auth';
import { getStore } from '../../../src/server/store';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ publicOrderCode: string }>;
}) {
  const { publicOrderCode } = await params;
  const uow = getStore();
  const tx = await uow.getTransactionByOrderCode(publicOrderCode);
  const jar = await cookies();
  const guestTx = jar.get(GUEST_SESSION_COOKIE)?.value;
  if (!tx) {
    return (
      <main className="page">
        <h1>Transaction not found</h1>
        <p className="meta">The public order code is a reference, not a login.</p>
      </main>
    );
  }
  const authorized = guestTx === tx.id;
  const snapshot = await uow.getSnapshot(tx.snapshotId);
  return (
    <main className="page">
      <div className="kicker">Paid</div>
      <h1>{tx.paymentState === 'CAPTURED' ? 'Paid' : 'Payment pending'}</h1>
      <p className="amount">{formatUsd(tx.amount)}</p>
      <p className="meta">Order {tx.publicOrderCode}</p>
      {authorized ? (
        <>
          <p className="notice">
            Your identity is hidden from the creator. Statement will show:{' '}
            {snapshot?.statementDescriptor}{' '}
            {snapshot?.descriptorIsSynthetic
              ? '(synthetic mock descriptor, not a live approval)'
              : ''}
            .
          </p>
          <p className="meta">
            Fulfillment: {tx.fulfillmentState.replaceAll('_', ' ').toLowerCase()}
          </p>
        </>
      ) : (
        <p className="notice">
          Public order codes are not credentials. Open the private access link from your receipt
          email to see status and take action.
        </p>
      )}
    </main>
  );
}
