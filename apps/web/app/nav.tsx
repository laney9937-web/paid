import Link from 'next/link';

export function CreatorNav({ current }: { current: string }) {
  const items = [
    ['/creator/home', 'Home'],
    ['/creator/transactions', 'Activity'],
    ['/creator/create', 'Create'],
    ['/creator/trust', 'Trust'],
    ['/creator/account', 'Account'],
  ] as const;
  return (
    <nav className="nav" aria-label="Creator">
      {items.map(([href, label]) => (
        <Link key={href} href={href} className={current === href ? 'active' : ''}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
