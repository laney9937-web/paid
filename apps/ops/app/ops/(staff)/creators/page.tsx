import Link from 'next/link';
import { listOpsCreators } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function CreatorsPage({
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
  const list = await listOpsCreators(params.q ?? '', params.page);
  return (
    <main>
      <h1>Creators</h1>
      <OpsNav current="/ops/creators" />
      <form>
        <label>
          Search
          <input name="q" defaultValue={params.q ?? ''} />
        </label>
        <button type="submit">Filter</button>
      </form>
      {list.rows.map((row) => (
        <div className="card" key={String(row.id)}>
          <Link href={`/ops/creators/${row.id}`}>{String(row.handle)}</Link>
          {' · '}
          {String(row.onboardingState)}
          {row.payoutHold ? ' · HOLD' : ''}
        </div>
      ))}
    </main>
  );
}
