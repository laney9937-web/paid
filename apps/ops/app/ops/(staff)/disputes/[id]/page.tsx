import { staffPage } from '../../gate';
import { OpsNav } from '../../nav';

export default async function OpsDispute({ params }: { params: Promise<{ id: string }> }) {
  const { allowed } = await staffPage('DISPUTES');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  const { id } = await params;
  return (
    <main>
      <h1>Dispute</h1>
      <OpsNav current="/ops/disputes" />
      <p>Financial resolution requires dual control above threshold.</p>
      <p className="meta">{id}</p>
    </main>
  );
}
