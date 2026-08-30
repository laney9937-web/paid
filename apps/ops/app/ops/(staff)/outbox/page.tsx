import { listOpsOutbox } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OutboxPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { allowed } = await staffPage('SECURITY');
  const payments = (await staffPage('PAYMENTS')).session.opsRoles.includes('PAYMENTS');
  if (!allowed && !payments)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsOutbox(params.page);
  return (
    <main>
      <h1>Outbox</h1>
      <OpsNav current="/ops/outbox" />
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.type} · {row.state} · attempts {row.attemptCount}
          {row.state === 'DEAD_LETTER' ? (
            <form method="post" action="/api/ops/outbox/retry">
              <input type="hidden" name="jobId" value={row.id} />
              <input type="hidden" name="reason" value="dead-letter-retry" />
              <input type="hidden" name="idempotencyKey" value={`outbox-${row.id}`} />
              <button type="submit" data-testid="ops-outbox-retry">
                Retry
              </button>
            </form>
          ) : null}
        </div>
      ))}
      {list.rows.length === 0 ? <p>No outbox jobs.</p> : null}
    </main>
  );
}
