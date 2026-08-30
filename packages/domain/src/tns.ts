import type { TnsCategory } from '@paid/contracts';

const RESTRICTED: ReadonlySet<TnsCategory> = new Set([
  'CHILD_SAFETY',
  'NON_CONSENSUAL',
  'PROSTITUTION_TRAFFICKING',
  'SANCTIONS',
  'TRANSACTION_LAUNDERING',
  'IP_DMCA',
  'LEGAL_PRIVACY',
]);

export function routeReport(category: TnsCategory): {
  caseType: TnsCategory;
  sla: 'RESTRICTED' | 'COMMERCIAL';
} {
  return {
    caseType: category,
    sla: RESTRICTED.has(category) ? 'RESTRICTED' : 'COMMERCIAL',
  };
}
