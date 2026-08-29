import Link from 'next/link';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../nav';
import { ensureDemoLink, withStore } from '../../../src/server/store';

export default async function CreatorHome() {
  await ensureDemoLink();
  const { balances, txs } = await withStore(async (uow) => ({
    balances: await uow.projectCreatorBalances('creator_maya', uow.clock.now()),
    txs: await uow.listTransactionsByCreator('creator_maya'),
  }));
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
        <div className="kicker">Maya</div>
      </div>
      <div className="kicker">Available</div>
      <div className="amount">
        {formatUsd({ amountMinor: balances.availableMinor, currency: 'USD' })}
      </div>
      <p className="meta">
        Pending {formatUsd({ amountMinor: balances.pendingMinor, currency: 'USD' })} · Next payout
        Tue
      </p>
      <Link
        className="primary"
        href="/creator/create"
        style={{ display: 'grid', placeItems: 'center', textDecoration: 'none', marginTop: 24 }}
      >
        Create link
      </Link>
      <div className="section">
        <div className="row">
          <strong>HIGH TRUST</strong>
          <span className="meta">4.75 ★ · 40 completed</span>
        </div>
      </div>
      <div className="section">
        <h2>Recent</h2>
        {txs.length === 0 ? <p className="empty">No transactions yet.</p> : null}
        {txs.slice(0, 3).map((tx) => (
          <Link
            key={tx.id}
            href={`/creator/transactions/${tx.id}`}
            className="tx"
            style={{ textDecoration: 'none' }}
          >
            <strong>{tx.publicOrderCode}</strong>
            <span>{formatUsd(tx.amount)}</span>
            <span className="status">{tx.fulfillmentState.replaceAll('_', ' ').toLowerCase()}</span>
          </Link>
        ))}
      </div>
      <CreatorNav current="/creator/home" />
    </main>
  );
}
