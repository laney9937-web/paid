import { withPostgresUow } from '@paid/db';
import { staffPage } from '../../gate';
import { OpsNav } from '../../nav';

export default async function OpsTx({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await staffPage('SUPPORT');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const { id } = await params;
  const tx = await withPostgresUow((uow) => uow.getTransaction(id));
  return (
    <main>
      <h1>Transaction</h1>
      <OpsNav current="/ops/transactions" />
      <p>Public order code is a reference only.</p>
      {tx ? (
        <div className="card">
          {tx.publicOrderCode} · {tx.paymentState} · {tx.fulfillmentState}
        </div>
      ) : (
        <p>Not found.</p>
      )}
    </main>
  );
}
