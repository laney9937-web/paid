import Link from 'next/link';
import { formatUsd } from '@paid/contracts';
import { CreatorNav } from '../../../nav';
import { withStore } from '../../../../src/server/store';
import { optionalCreatorSession } from '@paid/auth/http';

export const dynamic = 'force-dynamic';

export default async function CreatorHome() {
  const session = await optionalCreatorSession();
  if (!session?.creatorId) {
    return (
      <main className="page">
        <h1>Creator home</h1>
        <p className="empty" data-testid="home-signin">
          Sign in to see your payouts and transactions.
        </p>
        <Link href="/creator/sign-in">Sign in</Link>
      </main>
    );
  }
  const creatorId = session.creatorId;
  const { creator, balances, txs } = await withStore(async (uow) => ({
    creator: await uow.getCreator(creatorId),
    balances: await uow.projectCreatorBalances(creatorId, uow.clock.now()),
    txs: await uow.listTransactionsByCreator(creatorId),
  }));
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
        <div className="kicker">{creator?.displayName ?? 'Creator'}</div>
      </div>
      <div className="kicker">Available</div>
      <div className="amount" data-testid="home-available">
        {formatUsd({ amountMinor: balances.availableMinor, currency: 'USD' })}
      </div>
      <p className="meta">
        Pending {formatUsd({ amountMinor: balances.pendingMinor, currency: 'USD' })}
      </p>
      <Link
        className="primary"
        href="/creator/create"
        style={{ display: 'grid', placeItems: 'center', textDecoration: 'none', marginTop: 24 }}
      >
        Create link
      </Link>
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
