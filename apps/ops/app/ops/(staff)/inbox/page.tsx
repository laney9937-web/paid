import { listOpsInbox } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { session } = await staffPage('PAYMENTS');
  const allowed = session.opsRoles.includes('PAYMENTS') || session.opsRoles.includes('SECURITY');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsInbox(params.page);
  return (
    <main>
      <h1>Provider inbox</h1>
      <OpsNav current="/ops/inbox" />
      {list.rows.map((row) => (
        <div className="card" key={row.providerEventId}>
          {row.eventType} · {row.outcome} · {row.processed ? 'processed' : 'open'}
        </div>
      ))}
      {list.rows.length === 0 ? <p>No provider events.</p> : null}
    </main>
  );
}
