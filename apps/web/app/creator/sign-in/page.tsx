import Link from 'next/link';

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="page">
      <div className="brand">Paid</div>
      <h1>Sign in</h1>
      {params.sent ? (
        <p className="notice">If an account exists for that email, we sent a sign-in link.</p>
      ) : null}
      <form className="stack" method="post" action="/api/creator/magic-link">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <button className="primary" type="submit">
          Email me a link
        </button>
      </form>
      <p className="meta">Passkey sign-in is available after your first verified session.</p>
      <p className="meta">
        <Link href="/creator/onboarding">Create a creator account</Link>
      </p>
    </main>
  );
}
