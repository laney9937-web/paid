import Link from 'next/link';
import { CreatorNav } from '../../../nav';

export default function AccountPage() {
  return (
    <main className="page">
      <h1>Account</h1>
      <div className="stack">
        <p>Public name: Maya</p>
        <p>Verification: privately verified</p>
        <Link href="/creator/security">Security and passkeys</Link>
        <Link href="/creator/payouts">Payout destination</Link>
        <p className="meta">
          Changing payout details requires a fresh sign-in and starts a security cooldown.
        </p>
      </div>
      <CreatorNav current="/creator/account" />
    </main>
  );
}
