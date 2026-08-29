import Link from 'next/link';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../nav';
import { getStore } from '../../../src/server/store';

export default async function TransactionsPage() {
  const txs = await getStore().listTransactionsByCreator('creator_maya');
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
