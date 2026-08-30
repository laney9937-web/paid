import { CreatorNav } from '../../../nav';
import { listUserSessions } from '@paid/db';
import { optionalCreatorSession } from '@paid/auth/http';

export default async function SecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ stepUp?: string }>;
}) {
  const session = await optionalCreatorSession();
  const sessions = session ? await listUserSessions(session.userId) : [];
  const { stepUp } = await searchParams;
  return (
    <main className="page">
      <h1>Security</h1>
      {stepUp === 'payout' ? (
        <p className="notice" data-testid="step-up-required">
          Payouts require a fresh passkey step-up. This mock build does not mint a live
          authenticator.
        </p>
      ) : null}
      <p>
        Passkeys are the preferred sign-in. Magic links are short-lived and used once after you
        confirm.
      </p>
      <ul>
        {sessions.map((row) => (
          <li key={row.id}>
            {row.kind} · expires {row.expiresAt.toISOString()}
          </li>
        ))}
        {sessions.length === 0 ? <li>No sessions. Sign in first.</li> : null}
      </ul>
      {session ? (
        <form method="post" action="/api/creator/revoke-sessions">
          <button className="secondary" type="submit" data-testid="revoke-sessions">
            Revoke other sessions
          </button>
        </form>
      ) : null}
      <CreatorNav current="/creator/account" />
    </main>
  );
}
