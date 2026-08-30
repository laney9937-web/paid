'use client';

import { useRef, useState } from 'react';

const STORAGE_PREFIX = 'paid.checkout.idempotency:';
const memoryKeys = new Map<string, string>();

function readOrCreateKey(shareId: string): string {
  const storageKey = `${STORAGE_PREFIX}${shareId}`;
  try {
    const existing = sessionStorage.getItem(storageKey);
    if (existing && existing.length >= 8) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(storageKey, created);
    return created;
  } catch {
    const existing = memoryKeys.get(shareId);
    if (existing) return existing;
    const created = crypto.randomUUID();
    memoryKeys.set(shareId, created);
    return created;
  }
}

export function PayForm({ shareId }: { shareId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const keyRef = useRef<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!keyRef.current) keyRef.current = readOrCreateKey(shareId);
    setPending(true);
    setError(null);
    try {
      const res = await fetch('/api/transactions/checkout-sessions', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'idempotency-key': keyRef.current,
        },
        body: JSON.stringify({ shareId }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? 'Could not start checkout');
        setPending(false);
        return;
      }
      window.location.href = body.data.redirectPath;
    } catch {
      setError('Network issue. Try again.');
      setPending(false);
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
