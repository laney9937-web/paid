import { peekGuestToken } from '@paid/domain';
import { withStore } from '../../../../src/server/store';
import { ContinueForm } from './continue-form';

export const dynamic = 'force-dynamic';

export default async function GuestAccessPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const peek = await withStore((uow) => peekGuestToken(uow, token));
  return (
    <main className="page">
      <div className="kicker">Paid</div>
      <h1>Continue to your purchase</h1>
      <p className="meta" data-testid="scanner-safe-copy">
        Email scanners can open this page without unlocking the transaction. Continue only if you
        meant to.
      </p>
      {peek.valid ? (
        <ContinueForm token={token} />
      ) : (
        <p className="empty" data-testid="guest-invalid">
          This access link is not valid or was already used.
        </p>
      )}
    </main>
  );
}
