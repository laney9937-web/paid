export type LegalHold = Readonly<{
  subjectId: string;
  reason: string;
  createdAt: Date;
}>;

export type ClosurePlan = Readonly<{
  allowed: boolean;
  anonymize: readonly string[];
  retain: readonly string[];
  reason?: string;
}>;

export function planAccountClosure(input: {
  legalHold: LegalHold | null;
  financialRecordsRequired: boolean;
}): ClosurePlan {
  if (input.legalHold) {
    return {
      allowed: false,
      anonymize: [],
      retain: ['ledger', 'audit', 'transactions', 'identity_status'],
      reason: 'LEGAL_HOLD',
    };
  }
  return {
    allowed: true,
    anonymize: ['email', 'displayName', 'guestTokens', 'supportContact'],
    retain: input.financialRecordsRequired ? ['ledger', 'audit', 'transactions'] : ['audit'],
  };
}

export type ExportField =
  | 'publicOrderCode'
  | 'amount'
  | 'handle'
  | 'taxRaw'
  | 'sanctionsRaw'
  | 'restrictedIdentity'
  | 'adultTransactionLinkage';

export function planDataExport(role: 'CREATOR' | 'SUPPORT' | 'COMPLIANCE' | 'RISK'): {
  include: readonly ExportField[];
  exclude: readonly ExportField[];
} {
  const restricted: ExportField[] = [
    'taxRaw',
    'sanctionsRaw',
    'restrictedIdentity',
    'adultTransactionLinkage',
  ];
  if (role === 'COMPLIANCE' || role === 'RISK') {
    return {
      include: [
        'publicOrderCode',
        'amount',
        'handle',
        'taxRaw',
        'sanctionsRaw',
        'restrictedIdentity',
        'adultTransactionLinkage',
      ],
      exclude: [],
    };
  }
  return {
    include: ['publicOrderCode', 'amount', 'handle'],
    exclude: restricted,
  };
}
