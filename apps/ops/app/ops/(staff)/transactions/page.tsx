import Link from 'next/link';
import { listOpsTransactions } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { allowed } = await staffPage('SUPPORT');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsTransactions(params.q ?? '', params.page);
  return (
    <main>
      <h1>Transactions</h1>
      <OpsNav current="/ops/transactions" />
      <form>
        <label>
          Search
          <input name="q" defaultValue={params.q ?? ''} />
        </label>
        <button type="submit">Filter</button>
      </form>
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          <Link href={`/ops/transactions/${row.id}`}>{row.publicOrderCode}</Link>
          {' · '}
          {row.creatorHandle} · {row.paymentState}
        </div>
      ))}
    </main>
  );
}
