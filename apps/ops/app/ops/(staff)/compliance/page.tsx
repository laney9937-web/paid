import { listOpsCreators } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OpsCompliance() {
  const { allowed } = await staffPage('COMPLIANCE');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const list = await listOpsCreators('', '1');
  return (
    <main>
      <h1>Compliance</h1>
      <OpsNav current="/ops/compliance" />
      <p>Unknown required states fail closed. Live conclusions stay BLOCKED_EXTERNAL.</p>
      {list.rows.map((row) => (
        <form key={String(row.id)} method="post" action="/api/ops/restrict" className="card">
          <input type="hidden" name="creatorId" value={String(row.id)} />
          {String(row.handle)} · {String(row.onboardingState)}
          <label>
            Reason
            <input name="reason" required minLength={3} defaultValue="compliance-restrict" />
          </label>
          <label>
            Idempotency key
            <input
              name="idempotencyKey"
              required
              minLength={8}
              defaultValue={`restrict-${row.id}`}
            />
          </label>
          <button type="submit" data-testid="ops-restrict">
            Block new checkout
          </button>
        </form>
      ))}
    </main>
  );
}
