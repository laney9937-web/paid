import { staffPage } from '../gate';
import { OpsNav } from '../nav';

export default async function OpsSystem() {
  const { allowed } = await staffPage('SECURITY');
  if (!allowed)
    return (
      <main>
        <h1>Not allowed</h1>
      </main>
    );
  return (
    <main>
      <h1>System</h1>
      <OpsNav current="/ops/system" />
      <p>Kill switches: checkout, payout, adult lane, reviews, new links.</p>
    </main>
  );
}
