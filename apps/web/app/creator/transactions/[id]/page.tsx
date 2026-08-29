import { notFound } from 'next/navigation';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../../nav';
import { withStore } from '../../../../src/server/store';

export default async function CreatorTxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tx = await withStore((uow) => uow.getTransaction(id));
  if (!tx || tx.creatorId !== 'creator_maya') notFound();
  return (
    <main className="page">
      <h1>Order {tx.publicOrderCode}</h1>
      <p className="amount">{formatUsd(tx.amount)}</p>
      <p className="meta">Anonymous Buyer</p>
      <p className="meta">Payment: {tx.paymentState}</p>
      <p className="meta">Fulfillment: {tx.fulfillmentState}</p>
      <p className="notice">Buyer payment, legal, and support identity are never shown here.</p>
      <CreatorNav current="/creator/transactions" />
    </main>
  );
}
