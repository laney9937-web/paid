export default function SimulatorPage() {
  const prod = process.env.PAID_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (prod) {
    return (
      <main>
        <h1>Not found</h1>
      </main>
    );
  }
  return (
    <main>
      <h1>Provider simulator</h1>
      <p>Local/test only. Production startup rejects enablement and this route 404s.</p>
    </main>
  );
}
