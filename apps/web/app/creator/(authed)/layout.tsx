import type { ReactNode } from 'react';
import { requireCreatorSessionOrRedirect } from '@paid/auth/http';

export default async function CreatorAuthedLayout({ children }: { children: ReactNode }) {
  await requireCreatorSessionOrRedirect();
  return children;
}
