import type { OpsRole } from '@paid/contracts';
import { requireOpsSessionOrRedirect } from '@paid/auth/http';

export async function staffPage(role: OpsRole) {
  const session = await requireOpsSessionOrRedirect();
  return {
    session,
    allowed: session.opsRoles.includes(role),
  };
}
