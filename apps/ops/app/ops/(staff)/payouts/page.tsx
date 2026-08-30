import { listOpsPayouts } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function PayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { allowed } = await staffPage('PAYMENTS');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsPayouts(params.page);
  return (
    <main>
      <h1>Payouts</h1>
      <OpsNav current="/ops/payouts" />
      <p>A request is not paid. Final journals post on verified provider PAYOUT_PAID.</p>
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.handle} · {row.state} · {row.amountMinor}
        </div>
      ))}
      {list.rows.length === 0 ? <p>No payouts.</p> : null}
    </main>
  );
}
