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

export type RiskOverride = {
  subjectId: string;
  reason: string;
  actorId: string;
  expiresAt: Date;
  createdAt: Date;
  ruleVersion: string;
};

export function recordRiskOverride(input: {
  actorType: string;
  actorId?: string;
  opsRoles?: readonly string[];
  authStrength: string;
  subjectId: string;
  reason: string;
  expiresAt: Date;
  now: Date;
}): RiskOverride {
  if (input.actorType !== 'OPS' || !input.opsRoles?.includes('RISK')) {
    throw new Error('Risk override requires the RISK operator role');
  }
  if (input.authStrength !== 'STEP_UP' && input.authStrength !== 'PASSKEY') {
    throw new Error('Risk override requires fresh authentication');
  }
  if (input.reason.trim().length < 8) {
    throw new Error('Risk override requires a reason');
  }
  if (input.expiresAt <= input.now) {
    throw new Error('Risk override requires a future expiry');
  }
  if (!input.actorId) {
    throw new Error('Risk override requires an actor');
  }
  return {
    subjectId: input.subjectId,
    reason: input.reason.trim(),
    actorId: input.actorId,
    expiresAt: input.expiresAt,
    createdAt: input.now,
    ruleVersion: 'risk.override.v1',
  };
}
