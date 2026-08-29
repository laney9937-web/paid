import { createHash } from 'node:crypto';

export type ReconciliationBreak = {
  id: string;
  kind:
    | 'MISSING_CAPTURE'
    | 'MISSING_REFUND'
    | 'MISSING_FEE'
    | 'MISSING_RESERVE'
    | 'MISSING_PAYOUT'
    | 'AMOUNT_MISMATCH';
  sourceHash: string;
  detail: string;
};

export function hashSource(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function diffCounts(
  internal: number,
  provider: number,
  kind: ReconciliationBreak['kind'],
  sourceHash: string,
): ReconciliationBreak[] {
  if (internal === provider) return [];
  return [
    {
      id: `${kind}:${sourceHash.slice(0, 8)}`,
      kind,
      sourceHash,
      detail: `internal=${internal} provider=${provider}`,
    },
  ];
}

export function runReconciliation(input: {
  internalCaptures: number;
  providerCaptures: number;
  internalRefunds: number;
  providerRefunds: number;
  internalPayouts: number;
  providerPayouts: number;
  source: unknown;
}): ReconciliationBreak[] {
  const sourceHash = hashSource(input.source);
  return [
    ...diffCounts(input.internalCaptures, input.providerCaptures, 'MISSING_CAPTURE', sourceHash),
    ...diffCounts(input.internalRefunds, input.providerRefunds, 'MISSING_REFUND', sourceHash),
    ...diffCounts(input.internalPayouts, input.providerPayouts, 'MISSING_PAYOUT', sourceHash),
  ];
}
