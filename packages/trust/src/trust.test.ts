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
});
