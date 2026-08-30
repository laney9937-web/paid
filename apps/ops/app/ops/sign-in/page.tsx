export default async function OpsSignIn({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main>
      <p className="meta">Staff surface · isolated session</p>
      <h1>Paid operations</h1>
      <p>Sign in with a staff passkey. Order codes are not credentials.</p>
      {params.sent ? (
        <p className="notice">If an account exists for that email, we sent a sign-in link.</p>
      ) : null}
      {params.error ? <p className="error">That staff sign-in link is not valid.</p> : null}
      <form method="post" action="/api/ops/magic-link">
        <label htmlFor="email">Staff email</label>
        <p>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            data-testid="ops-email"
          />
        </p>
        <button type="submit" data-testid="ops-magic-link">
          Email me a staff link
        </button>
      </form>
      <p className="meta">Passkeys remain the stronger staff factor after the first session.</p>
    </main>
  );
}
