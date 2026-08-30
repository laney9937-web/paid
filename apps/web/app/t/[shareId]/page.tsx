import { notFound } from 'next/navigation';
import { formatUsd } from '@paid/contracts';
import { deliveryLabel, quoteFees } from '@paid/domain';
import { computeTrust } from '@paid/trust';
import { withStore } from '../../../src/server/store';
import { PayForm } from './pay-form';

export default async function TransactionLinkPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const data = await withStore(async (uow) => {
    const link = await uow.getLinkByShareId(shareId);
    if (!link) return null;
    const creator = await uow.getCreator(link.creatorId);
    if (!creator) return null;
    const reviews = await uow.listReviewsByCreator(creator.id);
    const eligible = reviews.filter((r) => r.includedInAggregate && r.rating);
    const txs = await uow.listTransactionsByCreator(creator.id);
    const completedCount = txs.filter((tx) => tx.fulfillmentState === 'BUYER_ACCEPTED').length;
    const tenureDays = Math.max(
      0,
      Math.floor((Date.now() - creator.memberSince.getTime()) / 86400000),
    );
    const trust = computeTrust({
      eligibleReviews: eligible.length,
      ratingSum: eligible.reduce((sum, r) => sum + (r.rating ?? 0), 0),
      uniqueBuyers: 0,
      completedCount,
      tenureDays,
      integrityFlags: creator.restricted ? 1 : 0,
    });
    return { link, creator, trust, fees: quoteFees(link.amount, uow.config.policy) };
  });
  if (!data?.link || !data.creator) notFound();
  const { link, creator, trust, fees } = data;
  return (
    <main className="page">
      <div className="topbar">
        <div>
          <div className="brand">{creator.displayName} ✓</div>
          <div className="kicker">{trust.tier} TRUST</div>
        </div>
        <span className="badge">PROTECTED</span>
      </div>
      <div className="amount">{formatUsd(link.amount)}</div>
      <p className="meta">Protected digital purchase · {deliveryLabel(link.deliveryDuration)}</p>
      <p className="meta">
        Creator purchase {formatUsd(link.amount)} · Paid Protection{' '}
        {formatUsd(fees.buyerProtectionFee)} · Total today {formatUsd(fees.totalToday)}
      </p>
      <p className="notice">
        Protected if the agreed deliverable is not provided under the protection policy. Your
        identity stays hidden from the creator. Statement will show: TRUST*CREATOR (synthetic mock
        descriptor).
      </p>
      {link.state === 'ACTIVE' ? (
        <PayForm shareId={shareId} />
      ) : (
        <p className="empty">This transaction is no longer available.</p>
      )}
    </main>
  );
}
