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
  return (
    <main>
      <h1>Compliance</h1>
      <OpsNav current="/ops/compliance" />
      <p>Unknown required states fail closed. Live conclusions stay BLOCKED_EXTERNAL.</p>
    </main>
  );
}
