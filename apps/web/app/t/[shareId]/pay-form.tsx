'use client';

import { useRef, useState } from 'react';

export function PayForm({ shareId }: { shareId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || submitted.current) return;
    submitted.current = true;
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions/checkout-sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': crypto.randomUUID() },
        body: JSON.stringify({ shareId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? 'Could not start checkout');
        setPending(false);
        submitted.current = false;
        return;
      }
      window.location.href = body.data.redirectPath;
    } catch {
      setError('Network issue. Try again.');
      setPending(false);
      submitted.current = false;
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ marginTop: 24 }}>
      {error ? (
        <p className="error" data-testid="checkout-error">
          {error}
        </p>
      ) : null}
      <button className="primary" type="submit" disabled={pending} data-testid="continue-to-pay">
        {pending ? 'Starting checkout…' : 'Continue to pay'}
      </button>
    </form>
  );
}
