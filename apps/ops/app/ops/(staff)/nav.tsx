import Link from 'next/link';

const ITEMS = [
  ['/ops/cases', 'Cases'],
  ['/ops/creators', 'Creators'],
  ['/ops/transactions', 'Transactions'],
  ['/ops/disputes', 'Disputes'],
  ['/ops/refunds', 'Refunds'],
  ['/ops/payouts', 'Payouts'],
  ['/ops/risk', 'Risk'],
  ['/ops/compliance', 'Compliance'],
  ['/ops/reconciliation', 'Recon'],
  ['/ops/inbox', 'Inbox'],
  ['/ops/outbox', 'Outbox'],
  ['/ops/audit', 'Audit'],
] as const;

export function OpsNav({ current }: { current: string }) {
  return (
    <nav className="meta" aria-label="Operations">
      {ITEMS.map(([href, label]) => (
        <span key={href}>
          <Link href={href} className={current === href ? 'active' : ''}>
            {label}
          </Link>{' '}
        </span>
      ))}
    </nav>
  );
}
