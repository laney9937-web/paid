import { CreatorNav } from '../../../nav';
import { computeTrust } from '@paid/trust';
import { withStore } from '../../../../src/server/store';
import { requireCreatorSessionOrRedirect } from '@paid/auth/http';

export default async function TrustPage() {
  const session = await requireCreatorSessionOrRedirect();
  const snapshot = await withStore(async (uow) => {
    const creator = await uow.getCreator(session.creatorId);
    if (!creator) return null;
    const reviews = await uow.listReviewsByCreator(creator.id);
    const eligible = reviews.filter((r) => r.includedInAggregate && r.rating);
    const txs = await uow.listTransactionsByCreator(creator.id);
    const completedCount = txs.filter((tx) => tx.fulfillmentState === 'BUYER_ACCEPTED').length;
    const tenureDays = Math.max(
      0,
      Math.floor((Date.now() - creator.memberSince.getTime()) / 86400000),
    );
    return computeTrust({
      eligibleReviews: eligible.length,
      ratingSum: eligible.reduce((sum, r) => sum + (r.rating ?? 0), 0),
      uniqueBuyers: 0,
      completedCount,
      tenureDays,
      integrityFlags: creator.restricted ? 1 : 0,
    });
  });
  return (
    <main className="page">
      <h1>Trust</h1>
      <p className="badge">{snapshot?.tier ?? 'BUILDING'} TRUST</p>
      <p>
        {snapshot?.publicRating
          ? `${snapshot.publicRating} ★`
          : 'Rating appears after 10 eligible reviews'}
        {' · '}
        Unique buyer counts stay unpublished until buyer linkage exists.
      </p>
      <p className="notice">
        Faster payouts become available as your transaction history, account security, payment risk,
        and dispute history qualify. Public trust never authorizes payout by itself.
      </p>
      <CreatorNav current="/creator/trust" />
    </main>
  );
}
