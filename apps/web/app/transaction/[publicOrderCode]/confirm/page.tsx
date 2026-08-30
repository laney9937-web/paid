export default function ConfirmPage() {
  return (
    <main className="page">
      <h1>Confirm delivery</h1>
      <p className="meta">Only the guest session for this transaction can confirm.</p>
      <form className="stack" method="post" action="/api/guest/confirm">
        <button className="primary" type="submit" data-testid="confirm-delivery">
          Confirm I received it
        </button>
      </form>
    </main>
  );
}
