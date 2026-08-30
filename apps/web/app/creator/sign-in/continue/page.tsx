export default async function MagicLinkContinuePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main className="page">
      <h1>Continue sign-in</h1>
      <p className="meta">
        Email scanners can open this page without signing you in. Continue only if you requested
        this link.
      </p>
      {token ? (
        <form className="stack" method="post" action="/api/creator/magic-link/consume">
          <input type="hidden" name="token" value={token} />
          <button className="primary" type="submit" data-testid="magic-continue">
            Sign in
          </button>
        </form>
      ) : (
        <p className="empty">Missing sign-in token.</p>
      )}
    </main>
  );
}
