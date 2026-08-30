import { listOpsAudit } from '@paid/db';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { allowed } = await staffPage('SUPPORT');
  if (!allowed) {
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  }
  const params = await searchParams;
  const cases = await listOpsAudit(params.q ?? 'TNS_REPORT', params.page);
  return (
    <main>
      <h1>Cases</h1>
      <OpsNav current="/ops/cases" />
      <p className="meta">
        Support can view cases. Payout holds require RISK plus a fresh step-up.
      </p>
      <form>
        <label>
          Filter action
          <input name="q" defaultValue={params.q ?? 'TNS_REPORT'} />
        </label>
        <button type="submit">Search</button>
      </form>
      {cases.rows.length === 0 ? (
        <div className="card">No open cases in the synthetic seed.</div>
      ) : null}
      {cases.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.action} · {row.subjectId} · {row.actorId} · {row.authStrength}
        </div>
      ))}
    </main>
  );
}
