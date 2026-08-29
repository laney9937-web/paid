import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <div className="topbar">
        <div className="brand">Paid</div>
        <div className="kicker">Safety. Privacy. Speed. Trust.</div>
      </div>
      <h1>Safer transactions when you do not know the person behind the username.</h1>
      <p className="meta">
        Creators verify privately, share one protected link, and build public trust. Buyers pay as
        guests and stay anonymous to the creator.
      </p>
      <div className="stack" style={{ marginTop: 28 }}>
        <Link
          className="primary"
          href="/creator/sign-in"
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
        >
          Creator sign in
        </Link>
        <Link
          className="secondary"
          href="/c/maya"
          style={{ display: 'grid', placeItems: 'center', textDecoration: 'none' }}
        >
          View Maya’s trust page
        </Link>
      </div>
    </main>
  );
}
