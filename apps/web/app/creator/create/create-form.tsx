'use client';

import { useState } from 'react';

export function CreateForm({ demoShare }: { demoShare: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
      }}
    >
      <div className="field">
        <label htmlFor="amount">Amount</label>
        <input
          id="amount"
          name="amount"
          defaultValue="50.00"
          inputMode="decimal"
          autoComplete="off"
        />
      </div>
      <div className="field">
        <label htmlFor="category">Category</label>
        <select id="category" name="category" defaultValue="DIGITAL_COMMISSION">
          <option value="DIGITAL_COMMISSION">Digital commission</option>
          <option value="CUSTOM_DIGITAL_CONTENT">Custom digital content</option>
          <option value="PREMADE_DIGITAL_CONTENT">Pre-made digital content</option>
          <option value="DIGITAL_SERVICE">Digital service</option>
          <option value="OTHER_PERMITTED_DIGITAL">Other permitted digital purchase</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="deadline">Delivery deadline</label>
        <select id="deadline" name="deadline" defaultValue="PT48H">
          <option value="PT24H">24 hours</option>
          <option value="PT48H">48 hours</option>
          <option value="P7D">7 days</option>
        </select>
      </div>
      <button className="primary" type="button" onClick={() => setCopied(true)}>
        Create link
      </button>
      <p className="meta">Ready to share · $50 · delivery within 48 hours</p>
      <div className="linkbox">{demoShare}</div>
      <button
        className="secondary"
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(demoShare);
          setCopied(true);
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </button>
    </form>
  );
}
