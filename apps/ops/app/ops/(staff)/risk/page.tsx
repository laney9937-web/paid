import { listOpsCreators } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OpsRisk() {
  const { allowed } = await staffPage('RISK');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const list = await listOpsCreators('', '1');
  return (
    <main>
      <h1>Risk</h1>
      <OpsNav current="/ops/risk" />
      <p>Public trust never authorizes payout. Overrides expire and are audited.</p>
      {list.rows.map((row) => (
        <form key={String(row.id)} method="post" action="/api/ops/hold" className="card">
          <input type="hidden" name="creatorId" value={String(row.id)} />
          {String(row.handle)} · hold {String(row.payoutHold)}
          <button type="submit" data-testid="ops-hold">
            Hold payouts
          </button>
        </form>
      ))}
    </main>
  );
}
