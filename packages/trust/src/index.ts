export type TrustInputs = {
  eligibleReviews: number;
  ratingSum: number;
  uniqueBuyers: number;
  completedCount: number;
  tenureDays: number;
  integrityFlags: number;
};

export type TrustSnapshot = {
  algorithmVersion: string;
  tier: 'BUILDING' | 'ESTABLISHED' | 'HIGH' | 'EXCEPTIONAL';
  publicRating: number | null;
  publicCompleted: number | null;
  inputsDigest: string;
};

const PRIOR_MEAN = 4.2;
const PRIOR_N = 8;

export type PublicTrustPresentation = {
  identityVerified: boolean;
  identityCopy: string;
  trustLabel: string;
};

/** Public copy must not claim HIGH TRUST or a verification mark without evidence. */
export function publicTrustPresentation(
  identityState: string,
  trust: TrustSnapshot,
): PublicTrustPresentation {
  const identityVerified = identityState === 'VERIFIED';
  const evidenceSufficient =
    trust.tier === 'ESTABLISHED' || trust.tier === 'HIGH' || trust.tier === 'EXCEPTIONAL';
  return {
    identityVerified,
    identityCopy: identityVerified ? 'Identity verified' : 'Identity not verified',
    trustLabel: evidenceSufficient ? `${trust.tier} TRUST` : 'New creator',
  };
}

export function computeTrust(inputs: TrustInputs, algorithmVersion = 'trust.v1'): TrustSnapshot {
  const bayes =
    inputs.eligibleReviews === 0
      ? null
      : (PRIOR_MEAN * PRIOR_N + inputs.ratingSum) / (PRIOR_N + inputs.eligibleReviews);
  const publicRating = inputs.eligibleReviews >= 10 && bayes ? Math.round(bayes * 100) / 100 : null;
  const publicCompleted = inputs.uniqueBuyers >= 20 ? inputs.completedCount : null;
  let tier: TrustSnapshot['tier'] = 'BUILDING';
  if (inputs.integrityFlags === 0) {
    if (inputs.tenureDays >= 180 && inputs.uniqueBuyers >= 100 && inputs.completedCount >= 200) {
      tier = 'EXCEPTIONAL';
    } else if (
      inputs.tenureDays >= 60 &&
      inputs.uniqueBuyers >= 20 &&
      inputs.completedCount >= 50
    ) {
      tier = 'HIGH';
    } else if (inputs.uniqueBuyers >= 5 && inputs.completedCount >= 10) {
      tier = 'ESTABLISHED';
    }
  }
  return {
    algorithmVersion,
    tier,
    publicRating,
    publicCompleted,
    inputsDigest: `${inputs.eligibleReviews}:${inputs.ratingSum}:${inputs.uniqueBuyers}:${inputs.completedCount}:${inputs.integrityFlags}`,
  };
}
