import Link from 'next/link';
import { listOpsDisputes } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { allowed } = await staffPage('DISPUTES');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsDisputes(params.page);
  return (
    <main>
      <h1>Disputes</h1>
      <OpsNav current="/ops/disputes" />
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          <Link href={`/ops/disputes/${row.id}`}>{row.id}</Link> · {row.state} · {row.reasonCode}
        </div>
      ))}
      {list.rows.length === 0 ? <p>No disputes.</p> : null}
    </main>
  );
}
