import { loadConfig } from '@paid/config';
import { peekMagicLink } from '@paid/db';
import { OpsMagicContinueForm } from './continue-form';

export const dynamic = 'force-dynamic';

export default async function OpsMagicContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const peek = token
    ? await peekMagicLink({ token, keyring: loadConfig().tokenKeyring, kind: 'OPS' })
    : { valid: false, expired: false, consumed: false };
  return (
    <main>
      <h1>Continue staff sign-in</h1>
      <p className="meta" data-testid="scanner-safe-copy">
        Email scanners can open this page without signing you in. Continue only if you requested
        this link. Order codes are not credentials.
      </p>
      {peek.valid && token ? (
        <OpsMagicContinueForm token={token} />
      ) : (
        <p data-testid="magic-invalid">This staff sign-in link is not valid or was already used.</p>
      )}
    </main>
  );
}
