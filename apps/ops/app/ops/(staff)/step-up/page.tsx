import { requireOpsSessionOrRedirect } from '@paid/auth/http';

export default async function StepUpPage() {
  await requireOpsSessionOrRedirect();
  return (
    <main>
      <h1>STEP_UP_REQUIRED</h1>
      <p>
        This action needs a fresh step-up. This provider-agnostic mock does not convert an
        email-link session into PASSKEY and does not present a fake upgrade.
      </p>
    </main>
  );
}
