import { loadConfig } from '@paid/config';
import { peekMagicLink } from '@paid/db';
import { MagicContinueForm } from './continue-form';

export const dynamic = 'force-dynamic';

export default async function MagicLinkContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const peek = token
    ? await peekMagicLink({ token, keyring: loadConfig().tokenKeyring, kind: 'CREATOR' })
    : { valid: false, expired: false, consumed: false };
  return (
    <main className="page">
      <h1>Continue sign-in</h1>
      <p className="meta" data-testid="scanner-safe-copy">
        Email scanners can open this page without signing you in. Continue only if you requested
        this link.
      </p>
      {peek.valid && token ? (
        <MagicContinueForm token={token} />
      ) : (
        <p className="empty" data-testid="magic-invalid">
          {peek.consumed
            ? 'This sign-in link was already used.'
            : peek.expired
              ? 'This sign-in link has expired.'
              : 'This sign-in link is not valid.'}
        </p>
      )}
    </main>
  );
}
