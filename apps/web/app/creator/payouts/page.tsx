import { CreatorNav } from '../../nav';

export default function PayoutsPage() {
  return (
    <main className="page">
      <h1>Payouts</h1>
      <p className="meta">Private payout risk is separate from public trust.</p>
      <p>Destination on file: mock US account (synthetic).</p>
      <p className="notice">There is no startup-financed instant payout path.</p>
      <CreatorNav current="/creator/account" />
    </main>
  );
}
