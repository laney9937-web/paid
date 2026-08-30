import type { ReactNode } from 'react';
import { requireOpsSessionOrRedirect } from '@paid/auth/http';

export default async function OpsStaffLayout({ children }: { children: ReactNode }) {
  await requireOpsSessionOrRedirect();
  return children;
}
