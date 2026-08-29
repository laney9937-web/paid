import { notFound } from 'next/navigation';
import { formatUsd } from '@paid/contracts';
import { deliveryLabel } from '@paid/domain';
import { getStore } from '../../../src/server/store';
import { PayForm } from './pay-form';

export default async function TransactionLinkPage({
  params,
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const uow = getStore();
  const link = await uow.getLinkByShareId(shareId);
  if (!link) notFound();
  const creator = await uow.getCreator(link.creatorId);
  if (!creator) notFound();
  return (
    <main className="page">
      <div className="topbar">
        <div>
          <div className="brand">{creator.displayName} ✓</div>
          <div className="kicker">HIGH TRUST</div>
        </div>
        <span className="badge">PROTECTED</span>
      </div>
      <div className="amount">{formatUsd(link.amount)}</div>
      <p className="meta">Protected digital purchase · {deliveryLabel(link.deliveryDuration)}</p>
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
