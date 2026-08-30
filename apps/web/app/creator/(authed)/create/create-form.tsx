'use client';

import { useState } from 'react';

export function CreateForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('50.00');

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const res = await fetch('/api/creator/transaction-links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          amount,
          category: String(form.get('category') ?? ''),
          deliveryDuration: String(form.get('deadline') ?? ''),
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error?.message ?? 'Could not create link');
        setPending(false);
        return;
      }
      setSharePath(body.data.path as string);
      setPending(false);
    } catch {
      setError('Network issue. Try again.');
      setPending(false);
    }
  }

  const shareUrl = sharePath ? `${window.location.origin}${sharePath}` : null;

  return (
    <form className="stack" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          name="amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          autoComplete="off"
          data-testid="link-amount"
        />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          defaultValue="DIGITAL_COMMISSION"
          data-testid="link-category"
        >
          <option value="DIGITAL_COMMISSION">Digital commission</option>
          <option value="CUSTOM_DIGITAL_CONTENT">Custom digital content</option>
          <option value="PREMADE_DIGITAL_CONTENT">Pre-made digital content</option>
          <option value="DIGITAL_SERVICE">Digital service</option>
          <option value="OTHER_PERMITTED_DIGITAL">Other permitted digital purchase</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="deadline">Delivery deadline</label>
        <select id="deadline" name="deadline" defaultValue="PT48H" data-testid="link-deadline">
          <option value="PT24H">24 hours</option>
          <option value="PT48H">48 hours</option>
          <option value="P7D">7 days</option>
        </select>
      </div>
      {error ? (
        <p className="error" data-testid="create-error">
          {error}
        </p>
      ) : null}
      <button className="primary" type="submit" disabled={pending} data-testid="create-link">
        {pending ? 'Creating…' : 'Create link'}
      </button>
      {shareUrl ? (
        <>
          <p className="meta">Ready to share · ${amount} · delivery within the selected deadline</p>
          <div className="linkbox" data-testid="share-url">
            {shareUrl}
          </div>
          <button
            className="secondary"
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(shareUrl);
              setCopied(true);
            }}
          >
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </>
      ) : null}
    </form>
  );
}
