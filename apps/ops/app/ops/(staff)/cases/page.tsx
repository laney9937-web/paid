import { withPostgresUow } from '@paid/db';

export default async function CasesPage() {
  const cases = await withPostgresUow((uow) => uow.listAuditsByAction('TNS_REPORT'));
  return (
    <main>
      <h1>Cases</h1>
      <p className="meta">
        Roles: Support, Disputes, Risk, Compliance, Payments, Security. There is no silent universal
        admin.
      </p>
      {cases.length === 0 ? <div className="card">No open cases in the synthetic seed.</div> : null}
      {cases.map((row) => (
        <div className="card" key={row.id}>
          {row.reason ?? row.action} · {row.subjectId}
        </div>
      ))}
      <form method="post" action="/api/ops/hold">
        <input type="hidden" name="creatorId" value="creator_maya" />
        <button type="submit" data-testid="ops-hold">
          Hold Maya payouts
        </button>
      </form>
    </main>
  );
}
