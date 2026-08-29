import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paid',
  description:
    'Paid makes online transactions safer when you do not know the person behind the username.',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
  manifest: '/manifest.webmanifest',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="banner">PROVIDER-AGNOSTIC BUILD · MOCK PAYMENTS · NO LIVE MONEY</div>
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
