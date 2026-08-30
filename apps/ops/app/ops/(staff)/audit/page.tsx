import { listOpsAudit } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OpsAudit({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { session } = await staffPage('SECURITY');
  const allowed = session.opsRoles.includes('SECURITY') || session.opsRoles.includes('COMPLIANCE');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const params = await searchParams;
  const list = await listOpsAudit(params.q ?? '', params.page);
  return (
    <main>
      <h1>Audit</h1>
      <OpsNav current="/ops/audit" />
      <p>Privileged and financial actions are immutable events.</p>
      <form>
        <label>
          Action
          <input name="q" defaultValue={params.q ?? ''} />
        </label>
        <button type="submit">Filter</button>
      </form>
      {list.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.action} · {row.actorId} · {row.roles} · {row.authStrength} · {row.sessionId}
        </div>
      ))}
    </main>
  );
}
