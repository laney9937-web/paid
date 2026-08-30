import Link from 'next/link';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../nav';
import { withStore } from '../../../src/server/store';
import { optionalCreatorSession } from '../../../src/server/session';

export default async function TransactionsPage() {
  const session = await optionalCreatorSession();
  if (!session?.creatorId) {
    return (
      <main className="page">
        <h1>Transactions</h1>
        <p className="empty">Sign in to see your transactions.</p>
      </main>
    );
  }
  const txs = await withStore((uow) => uow.listTransactionsByCreator(session.creatorId!));
  return (
    <main className="page">
      <h1>Transactions</h1>
      {txs.length === 0 ? <p className="empty">No transactions yet.</p> : null}
      {txs.map((tx) => (
        <Link
          key={tx.id}
          href={`/creator/transactions/${tx.id}`}
          className="tx"
          style={{ textDecoration: 'none' }}
        >
          <strong>{tx.publicOrderCode}</strong>
          <span>{formatUsd(tx.amount)}</span>
          <span className="status">
            {tx.paymentState} · {tx.fulfillmentState}
          </span>
        </Link>
      ))}
      <CreatorNav current="/creator/transactions" />
    </main>
  );
}
