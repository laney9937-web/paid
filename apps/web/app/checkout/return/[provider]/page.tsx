import { safeCheckoutReturnPath } from '@paid/domain';

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  let statusPath = '/creator/home';
  let rejected = false;
  try {
    statusPath = safeCheckoutReturnPath({
      requested: params.next,
      fallback: '/creator/home',
    });
  } catch {
    rejected = true;
  }
  return (
    <main className="page">
      <h1>Returning from checkout</h1>
      <p className="notice">
        A browser return is not payment proof. Paid waits for the provider’s signed event or API
        confirmation before marking a purchase paid.
      </p>
      {rejected ? (
        <p className="error">That return address is not allowed.</p>
      ) : (
        <p className="meta">
          Continue only on Paid: <a href={statusPath}>{statusPath}</a>
        </p>
      )}
    </main>
  );
}
