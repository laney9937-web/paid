export const PROHIBITED_FEATURES = [
  'race',
  'ethnicity',
  'religion',
  'gender',
  'sexualOrientation',
  'disability',
] as const;

export type RiskDecision = {
  outcome: 'ALLOW' | 'REVIEW' | 'DENY';
  ruleVersion: string;
  reasonCodes: string[];
  expiresAt: Date;
};

export function evaluatePayoutRisk(input: {
  publicTrustTier: string | null;
  recentRecovery: boolean;
  destinationAgeHours: number;
  chargebackCount: number;
  payoutHold: boolean;
  ruleVersion?: string;
  now?: Date;
}): RiskDecision {
  const reasons: string[] = [];
  if (input.payoutHold) reasons.push('MANUAL_HOLD');
  if (input.recentRecovery) reasons.push('RECOVERY_COOLDOWN');
  if (input.destinationAgeHours < 48) reasons.push('DESTINATION_COOLDOWN');
  if (input.chargebackCount > 0) reasons.push('CHARGEBACK_HISTORY');
  void input.publicTrustTier;
  return {
    outcome: reasons.length ? 'REVIEW' : 'ALLOW',
    ruleVersion: input.ruleVersion ?? 'risk.v1.mock',
    reasonCodes: reasons,
    expiresAt: new Date((input.now ?? new Date()).getTime() + 7 * 86400 * 1000),
  };
}

export function assertNoProhibitedFeatures(featureNames: string[]): void {
  for (const name of featureNames) {
    if ((PROHIBITED_FEATURES as readonly string[]).includes(name)) {
      throw new Error(`Prohibited risk feature ${name}`);
    }
  }
}
