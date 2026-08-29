import { cookies } from 'next/headers';
import { formatUsd } from '@paid/contracts';
import { GUEST_SESSION_COOKIE } from '@paid/auth';
import { withStore } from '../../../src/server/store';
import { MockPayButton } from './mock-pay-button';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ publicOrderCode: string }>;
}) {
  const { publicOrderCode } = await params;
  const data = await withStore(async (uow) => {
    const tx = await uow.getTransactionByOrderCode(publicOrderCode);
    if (!tx) return null;
    const snapshot = await uow.getSnapshot(tx.snapshotId);
    return { tx, snapshot };
  });
  const jar = await cookies();
  const guestTx = jar.get(GUEST_SESSION_COOKIE)?.value;
  if (!data) {
    return (
      <main className="page">
        <h1>Transaction not found</h1>
        <p className="meta">The public order code is a reference, not a login.</p>
      </main>
    );
  }
  const { tx, snapshot } = data;
  const authorized = guestTx === tx.id;
  return (
    <main className="page">
      <div className="kicker">Paid</div>
      <h1 data-testid="receipt-status">
        {tx.paymentState === 'CAPTURED' ? 'Paid' : 'Payment pending'}
      </h1>
      <p className="amount">{formatUsd(tx.amount)}</p>
      <p className="meta" data-testid="order-code">
        Order {tx.publicOrderCode}
      </p>
      {authorized ? (
        <>
          <p className="notice" data-testid="guest-authorized">
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
          {tx.paymentState !== 'CAPTURED' ? (
            <MockPayButton publicOrderCode={tx.publicOrderCode} />
          ) : null}
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
