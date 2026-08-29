import { notFound } from 'next/navigation';
import Link from 'next/link';
import { computeTrust } from '@paid/trust';
import { ensureDemoLink, getStore } from '../../../src/server/store';

export default async function CreatorTrustPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const uow = getStore();
  const creator = await uow.getCreatorByHandle(handle);
  if (!creator) notFound();
  await ensureDemoLink();
  const trust = computeTrust({
    eligibleReviews: 24,
    ratingSum: 114,
    uniqueBuyers: 22,
    completedCount: 40,
    tenureDays: 220,
    integrityFlags: 0,
  });
  const links = await uow.listLinksByCreator(creator.id);
  const active = links.find((l) => l.state === 'ACTIVE');
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
        <span className="badge">HIGH TRUST</span>
      </div>
      <h1>{creator.displayName} ✓</h1>
      <p className="meta">
        {trust.publicRating
          ? `${trust.publicRating} ★`
          : 'Rating appears after 10 eligible reviews'}{' '}
        · {trust.publicCompleted ?? 'Completed volume appears after 20 unique buyers'} completed
      </p>
      <p className="meta">Identity privately verified · Member since Jan 2026</p>
      <hr className="divider" />
      <p>
        Protected digital purchases. Your payment identity stays hidden from {creator.displayName}.
        This page does not show payout limits, legal identity, or buyer names.
      </p>
      {active ? (
        <Link
          className="primary"
          href={`/t/${active.shareId}`}
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none', marginTop: 24 }}
        >
          Pay {creator.displayName}
        </Link>
      ) : (
        <p className="empty">No active payment link.</p>
      )}
    </main>
  );
}
