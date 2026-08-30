export default function OnboardingPage() {
  return (
    <main className="page">
      <h1>Creator onboarding</h1>
      <ol className="stack">
        <li>Accept the creator agreement (versioned)</li>
        <li>Private identity and age verification (mock states in this build)</li>
        <li>Choose a public pseudonym</li>
      </ol>
      <p className="notice">Legal identity never appears on your public trust page.</p>
      <form className="stack" method="post" action="/api/creator/agreements">
        <button className="primary" type="submit" data-testid="accept-agreement">
          Accept agreement v1
        </button>
      </form>
    </main>
  );
}
