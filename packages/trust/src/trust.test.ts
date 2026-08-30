import { describe, expect, it } from 'vitest';
import { computeTrust } from './index';

describe('trust publication thresholds', () => {
  it('hides ratings below 10 reviews and percentages below 20 unique buyers', () => {
    const low = computeTrust({
      eligibleReviews: 9,
      ratingSum: 45,
      uniqueBuyers: 9,
      completedCount: 9,
      tenureDays: 10,
      integrityFlags: 0,
    });
    expect(low.publicRating).toBeNull();
    expect(low.publicCompleted).toBeNull();
    const high = computeTrust({
      eligibleReviews: 20,
      ratingSum: 96,
      uniqueBuyers: 25,
      completedCount: 55,
      tenureDays: 90,
      integrityFlags: 0,
    });
    expect(high.publicRating).not.toBeNull();
    expect(high.publicCompleted).toBe(55);
    expect(high.tier).toBe('HIGH');
  });

  it('does not present HIGH TRUST or a verification mark without evidence', async () => {
    const { publicTrustPresentation } = await import('./index');
    const building = computeTrust({
      eligibleReviews: 0,
      ratingSum: 0,
      uniqueBuyers: 0,
      completedCount: 0,
      tenureDays: 1,
      integrityFlags: 0,
    });
    const unverified = publicTrustPresentation('UNVERIFIED', building);
    expect(unverified.identityVerified).toBe(false);
    expect(unverified.identityCopy).toBe('Identity not verified');
    expect(unverified.trustLabel).toBe('New creator');
    expect(unverified.trustLabel).not.toMatch(/HIGH TRUST/);
    const verifiedNew = publicTrustPresentation('VERIFIED', building);
    expect(verifiedNew.identityVerified).toBe(true);
    expect(verifiedNew.identityCopy).toBe('Identity verified');
    expect(verifiedNew.trustLabel).toBe('New creator');
    const earnedTrust = computeTrust({
      eligibleReviews: 20,
      ratingSum: 96,
      uniqueBuyers: 25,
      completedCount: 55,
      tenureDays: 90,
      integrityFlags: 0,
    });
    const earned = publicTrustPresentation('VERIFIED', earnedTrust);
    expect(earned.trustLabel).toBe('HIGH TRUST');
  });
});
