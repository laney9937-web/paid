import { CreatorNav } from '../../nav';

export default function TrustPage() {
  return (
    <main className="page">
      <h1>Trust</h1>
      <p className="badge">HIGH TRUST</p>
      <p>4.75 ★ · 40 completed transactions</p>
      <p className="notice">
        Faster payouts become available as your transaction history, account security, payment risk,
        and dispute history qualify. Public trust never authorizes payout by itself.
      </p>
      <CreatorNav current="/creator/trust" />
    </main>
  );
}
