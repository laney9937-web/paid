import { listOpsAudit, loadReconSnapshot } from '@paid/db';
import { runReconciliation } from '@paid/reconciliation';
import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OpsRecon() {
  const { session } = await staffPage('PAYMENTS');
  const allowed = session.opsRoles.includes('PAYMENTS') || session.opsRoles.includes('RISK');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const snapshot = await loadReconSnapshot();
  const breaks = runReconciliation({
    internalCaptures: snapshot.internalCaptures,
    providerCaptures: snapshot.providerCaptures,
    internalRefunds: snapshot.internalRefunds,
    providerRefunds: snapshot.providerRefunds,
    internalPayouts: snapshot.internalPayouts,
    providerPayouts: snapshot.providerPayouts,
    source: snapshot,
  });
  const history = await listOpsAudit('RECONCILIATION_RUN', '1');
  return (
    <main>
      <h1>Reconciliation</h1>
      <OpsNav current="/ops/reconciliation" />
      <p>Breaks create cases. Balances are never overwritten.</p>
      <p data-testid="recon-breaks">Open breaks: {breaks.length}</p>
      <form method="post" action="/api/ops/reconciliation" className="card">
        <label>
          Reason
          <input name="reason" required minLength={3} defaultValue="scheduled-recon" />
        </label>
        <label>
          Idempotency key
          <input name="idempotencyKey" required minLength={8} defaultValue="recon-run-1" />
        </label>
        <button type="submit" data-testid="ops-recon">
          Run reconciliation
        </button>
      </form>
      {history.rows.map((row) => (
        <div className="card" key={row.id}>
          {row.action} · {row.actorId} · {row.authStrength}
        </div>
      ))}
    </main>
  );
}
