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
  return (
    <main>
      <h1>Reconciliation</h1>
      <OpsNav current="/ops/reconciliation" />
      <p>Breaks create cases. Balances are never overwritten.</p>
    </main>
  );
}
