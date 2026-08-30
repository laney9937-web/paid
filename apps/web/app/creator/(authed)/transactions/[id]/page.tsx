import { notFound } from 'next/navigation';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../../../nav';
import { withStore } from '../../../../../src/server/store';
import { optionalCreatorSession } from '@paid/auth/http';

export default async function CreatorTxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await optionalCreatorSession();
  const tx = await withStore((uow) => uow.getTransaction(id));
  if (!tx || !session?.creatorId || tx.creatorId !== session.creatorId) notFound();
  return (
    <main className="page">
      <h1>Order {tx.publicOrderCode}</h1>
      <p className="amount">{formatUsd(tx.amount)}</p>
      <p className="meta">Anonymous Buyer</p>
      <p className="meta">Payment: {tx.paymentState}</p>
      <p className="meta">Fulfillment: {tx.fulfillmentState}</p>
      <p className="notice">Buyer payment, legal, and support identity are never shown here.</p>
      {tx.paymentState === 'CAPTURED' && tx.fulfillmentState === 'AWAITING_DELIVERY' ? (
        <form className="stack" method="post" action="/api/creator/deliver">
          <input type="hidden" name="transactionId" value={tx.id} />
          <button className="primary" type="submit" data-testid="mark-delivered">
            Mark delivered
          </button>
        </form>
      ) : null}
      <CreatorNav current="/creator/transactions" />
    </main>
  );
}
