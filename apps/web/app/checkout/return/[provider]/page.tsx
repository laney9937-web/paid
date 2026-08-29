export default async function CheckoutReturnPage() {
  return (
    <main className="page">
      <h1>Returning from checkout</h1>
      <p className="notice">
        A browser return is not payment proof. Paid waits for the provider’s signed event or API
        confirmation before marking a purchase paid.
      </p>
    </main>
  );
}
