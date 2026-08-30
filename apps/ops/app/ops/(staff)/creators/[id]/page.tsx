import { withPostgresUow } from '@paid/db';
import { staffPage } from '../../gate';
import { OpsNav } from '../../nav';

export default async function OpsCreator({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await staffPage('SUPPORT');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const { id } = await params;
  const creator = await withPostgresUow((uow) => uow.getCreator(id));
  return (
    <main>
      <h1>Creator</h1>
      <OpsNav current="/ops/creators" />
      <p>Restricted identity fields are hidden from support.</p>
      {creator ? (
        <div className="card">
          {creator.handle} · {creator.onboardingState} · payout hold {String(creator.payoutHold)}
        </div>
      ) : (
        <p>Not found.</p>
      )}
    </main>
  );
}
