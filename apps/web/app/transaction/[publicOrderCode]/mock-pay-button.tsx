'use client';

import { useState } from 'react';

export function MockPayButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/mock/complete-payment', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
        body: JSON.stringify({}),
        cache: 'no-store',
      });
      const payload = (await res.json()) as {
        data?: { paymentState?: string };
        error?: { message?: string };
      };
      if (!res.ok || payload.data?.paymentState !== 'CAPTURED') {
        setError(payload.error?.message ?? 'Could not complete mock payment');
        setPending(false);
        return;
      }
      const next = new URL(window.location.href);
      next.searchParams.set('captured', '1');
      window.location.assign(next.toString());
    } catch {
      setError('Network issue. Try again.');
      setPending(false);
    }
  }

  return (
    <div className="stack" style={{ marginTop: 24 }}>
      {error ? <p className="error">{error}</p> : null}
      <button
        className="primary"
        type="button"
        onClick={onClick}
        disabled={pending}
        data-testid="complete-mock-payment"
      >
        {pending ? 'Recording provider capture…' : 'Complete mock payment'}
      </button>
      <p className="meta">
        This simulates a signed provider capture. The browser return is not payment proof.
      </p>
    </div>
  );
}
