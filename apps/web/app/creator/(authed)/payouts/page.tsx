import { CreatorNav } from '../../../nav';
import { withStore } from '../../../../src/server/store';
import { optionalCreatorSession } from '@paid/auth/http';

export default async function PayoutsPage() {
  const session = await optionalCreatorSession();
  const balances = session?.creatorId
    ? await withStore((uow) => uow.projectCreatorBalances(session.creatorId!, uow.clock.now()))
    : null;
  return (
    <main className="page">
      <h1>Payouts</h1>
      <p className="meta">Private payout risk is separate from public trust.</p>
      <p>Destination on file: mock US account (synthetic).</p>
      {balances ? (
        <p className="meta" data-testid="payout-available">
          Available {balances.availableMinor.toString()} · reserved{' '}
          {balances.reservedMinor.toString()}
        </p>
      ) : (
        <p className="empty">Sign in to see payout projections.</p>
      )}
      <p className="notice">
        There is no startup-financed instant payout path. Payout requests require a fresh passkey
        step-up.
      </p>
      {session ? (
        <form className="stack" method="post" action="/api/creator/payouts">
          <button className="secondary" type="submit" data-testid="request-payout">
            Request payout
          </button>
        </form>
      ) : null}
      <CreatorNav current="/creator/account" />
    </main>
  );
}
