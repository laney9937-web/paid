import { listOpsRefunds } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function RefundsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { session, allowed } = await staffPage('PAYMENTS');
  const disputes = session.opsRoles.includes('DISPUTES');
  if (!allowed && !disputes)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsRefunds(params.page);
  return (
    <main>
      <h1>Refunds</h1>
      <OpsNav current="/ops/refunds" />
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.id} · {row.state} · {row.amountMinor}
        </div>
      ))}
      {list.rows.length === 0 ? <p>No refunds.</p> : null}
    </main>
  );
}
