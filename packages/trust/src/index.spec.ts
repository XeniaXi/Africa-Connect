import {
  computeVerificationScore,
  computeReviewQualityScore,
  computeTransactionScore,
  computeResponseTimeScore,
  computeComplaintHistoryScore,
  computeFreshnessScore,
  computePartnerConfidenceScore,
  computeTrustScore,
  TRUST_THRESHOLDS,
  type TrustInputs,
} from './index';

// ─── helpers ────────────────────────────────────────────────────────────────
const baseInputs: TrustInputs = {
  verificationLevel: 3,
  averageRating: 4.0,
  reviewCount: 10,
  verifiedReviewCount: 5,
  completedBookingsCount: 20,
  totalBookingsCount: 25,
  averageResponseTimeHours: 4,
  complaintCount: 1,
  resolvedComplaintCount: 1,
  lastActivityDaysAgo: 5,
  partnerTrustWeight: 1.0,
};

// ─── computeVerificationScore ────────────────────────────────────────────────
describe('computeVerificationScore', () => {
  it('maps every level to the documented score', () => {
    expect(computeVerificationScore(0)).toBe(0);
    expect(computeVerificationScore(1)).toBe(20);
    expect(computeVerificationScore(2)).toBe(35);
    expect(computeVerificationScore(3)).toBe(55);
    expect(computeVerificationScore(4)).toBe(70);
    expect(computeVerificationScore(5)).toBe(85);
    expect(computeVerificationScore(6)).toBe(100);
  });

  it('caps at level 6 for any value above 6', () => {
    expect(computeVerificationScore(7)).toBe(100);
    expect(computeVerificationScore(99)).toBe(100);
  });

  it('returns 0 for negative levels', () => {
    expect(computeVerificationScore(-1)).toBe(0);
  });
});

// ─── computeReviewQualityScore ───────────────────────────────────────────────
describe('computeReviewQualityScore', () => {
  it('returns 0 when there are no reviews', () => {
    expect(computeReviewQualityScore(null, 0, 0)).toBe(0);
    expect(computeReviewQualityScore(4.0, 0, 0)).toBe(0);
  });

  it('returns 0 when averageRating is null', () => {
    expect(computeReviewQualityScore(null, 10, 5)).toBe(0);
  });

  it('scores a 5-star business with verified reviews near max', () => {
    const score = computeReviewQualityScore(5, 20, 20);
    expect(score).toBeGreaterThanOrEqual(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('scores a 1-star business near 0 (volume bonus still applies)', () => {
    // ratingScore = (1-1)/4 * 100 = 0
    // volumeBonus = Math.min(1/20, 1) * 10 = 0.5
    // verifiedBonus = 0
    const score = computeReviewQualityScore(1, 1, 0);
    expect(score).toBeCloseTo(0.5, 1);
    expect(score).toBeLessThan(5);
  });

  it('never exceeds 100', () => {
    const score = computeReviewQualityScore(5, 100, 100);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('adds volume bonus up to +10 for 20 reviews', () => {
    const withVolume    = computeReviewQualityScore(4, 20, 0);
    const withoutVolume = computeReviewQualityScore(4, 1, 0);
    expect(withVolume).toBeGreaterThan(withoutVolume);
  });

  it('adds verified review bonus up to +15', () => {
    const allVerified  = computeReviewQualityScore(4, 10, 10);
    const noneVerified = computeReviewQualityScore(4, 10, 0);
    expect(allVerified).toBeGreaterThan(noneVerified);
  });
});

// ─── computeTransactionScore ─────────────────────────────────────────────────
describe('computeTransactionScore', () => {
  it('returns 0 when total bookings is 0 (no divide-by-zero)', () => {
    expect(computeTransactionScore(0, 0)).toBe(0);
  });

  it('returns only volume bonus when completed is 0 (completion rate = 0)', () => {
    // completionRate = 0, volumeScore = Math.min(10/50, 1) * 20 = 4
    const score = computeTransactionScore(0, 10);
    expect(score).toBe(4);
    expect(score).toBeLessThan(10); // still low — volume alone can't save a zero-completion business
  });

  it('returns 100 for 100% completion rate with high volume', () => {
    const score = computeTransactionScore(50, 50);
    expect(score).toBe(100);
  });

  it('applies volume bonus up to +20 for 50+ bookings', () => {
    const highVolume = computeTransactionScore(50, 50);
    const lowVolume  = computeTransactionScore(1, 1);
    expect(highVolume).toBeGreaterThan(lowVolume);
  });

  it('never exceeds 100', () => {
    expect(computeTransactionScore(1000, 1000)).toBeLessThanOrEqual(100);
  });

  it('penalises partial completion rates proportionally', () => {
    const full = computeTransactionScore(10, 10);
    const half = computeTransactionScore(5, 10);
    expect(full).toBeGreaterThan(half);
  });
});

// ─── computeResponseTimeScore ────────────────────────────────────────────────
describe('computeResponseTimeScore', () => {
  it('returns 0 when response time is null (no data)', () => {
    expect(computeResponseTimeScore(null)).toBe(0);
  });

  it('returns 100 for <= 1 hour', () => {
    expect(computeResponseTimeScore(0)).toBe(100);
    expect(computeResponseTimeScore(1)).toBe(100);
  });

  it('returns 85 for 1-4 hours', () => {
    expect(computeResponseTimeScore(2)).toBe(85);
    expect(computeResponseTimeScore(4)).toBe(85);
  });

  it('returns 65 for 4-12 hours', () => {
    expect(computeResponseTimeScore(6)).toBe(65);
    expect(computeResponseTimeScore(12)).toBe(65);
  });

  it('returns 45 for 12-24 hours', () => {
    expect(computeResponseTimeScore(18)).toBe(45);
    expect(computeResponseTimeScore(24)).toBe(45);
  });

  it('returns 25 for 24-48 hours', () => {
    expect(computeResponseTimeScore(36)).toBe(25);
    expect(computeResponseTimeScore(48)).toBe(25);
  });

  it('returns 10 for > 48 hours', () => {
    expect(computeResponseTimeScore(72)).toBe(10);
    expect(computeResponseTimeScore(999)).toBe(10);
  });
});

// ─── computeComplaintHistoryScore ────────────────────────────────────────────
describe('computeComplaintHistoryScore', () => {
  it('returns 100 when there are no complaints', () => {
    expect(computeComplaintHistoryScore(0, 0, 100)).toBe(100);
  });

  it('returns max when all complaints resolved with high booking volume', () => {
    const score = computeComplaintHistoryScore(1, 1, 1000);
    expect(score).toBeGreaterThan(70);
  });

  it('penalises heavily for unresolved complaints', () => {
    const allResolved  = computeComplaintHistoryScore(5, 5, 50);
    const noneResolved = computeComplaintHistoryScore(5, 0, 50);
    expect(allResolved).toBeGreaterThan(noneResolved);
  });

  it('never goes below 0', () => {
    // 100 complaints, 0 resolved, only 10 bookings
    const score = computeComplaintHistoryScore(100, 0, 10);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 bookings without divide-by-zero', () => {
    expect(() => computeComplaintHistoryScore(1, 0, 0)).not.toThrow();
  });
});

// ─── computeFreshnessScore ───────────────────────────────────────────────────
describe('computeFreshnessScore', () => {
  it('returns 100 for activity within the last 7 days', () => {
    expect(computeFreshnessScore(0)).toBe(100);
    expect(computeFreshnessScore(7)).toBe(100);
  });

  it('returns 80 for 8-30 days ago', () => {
    expect(computeFreshnessScore(15)).toBe(80);
    expect(computeFreshnessScore(30)).toBe(80);
  });

  it('returns 60 for 31-90 days ago', () => {
    expect(computeFreshnessScore(60)).toBe(60);
    expect(computeFreshnessScore(90)).toBe(60);
  });

  it('returns 40 for 91-180 days ago', () => {
    expect(computeFreshnessScore(120)).toBe(40);
    expect(computeFreshnessScore(180)).toBe(40);
  });

  it('returns 20 for 181-365 days ago', () => {
    expect(computeFreshnessScore(270)).toBe(20);
    expect(computeFreshnessScore(365)).toBe(20);
  });

  it('returns 5 for over a year', () => {
    expect(computeFreshnessScore(366)).toBe(5);
    expect(computeFreshnessScore(730)).toBe(5);
  });
});

// ─── computePartnerConfidenceScore ───────────────────────────────────────────
describe('computePartnerConfidenceScore', () => {
  it('returns 50 for minimum trust weight (0.5 → 25)', () => {
    expect(computePartnerConfidenceScore(0.5)).toBe(25);
  });

  it('returns 50 for trust weight 1.0', () => {
    expect(computePartnerConfidenceScore(1.0)).toBe(50);
  });

  it('returns 100 for maximum trust weight (2.0)', () => {
    expect(computePartnerConfidenceScore(2.0)).toBe(100);
  });

  it('never exceeds 100', () => {
    expect(computePartnerConfidenceScore(10)).toBeLessThanOrEqual(100);
  });

  it('returns 0 for trust weight 0', () => {
    expect(computePartnerConfidenceScore(0)).toBe(0);
  });
});

// ─── computeTrustScore (integration) ─────────────────────────────────────────
describe('computeTrustScore', () => {
  it('returns all 7 score components', () => {
    const result = computeTrustScore(baseInputs);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('verificationScore');
    expect(result).toHaveProperty('reviewQualityScore');
    expect(result).toHaveProperty('transactionScore');
    expect(result).toHaveProperty('responseTimeScore');
    expect(result).toHaveProperty('complaintHistoryScore');
    expect(result).toHaveProperty('freshnessScore');
    expect(result).toHaveProperty('partnerConfidenceScore');
    expect(result).toHaveProperty('explanation');
  });

  it('total is a whole number between 0 and 100', () => {
    const result = computeTrustScore(baseInputs);
    expect(result.total).toBeGreaterThanOrEqual(0);
    expect(result.total).toBeLessThanOrEqual(100);
    expect(Number.isInteger(result.total)).toBe(true);
  });

  it('meets MIN_FOR_AI_DISPLAY threshold for a decent business', () => {
    const result = computeTrustScore(baseInputs);
    expect(result.total).toBeGreaterThanOrEqual(TRUST_THRESHOLDS.MIN_FOR_AI_DISPLAY);
  });

  it('meets MIN_FOR_TRUSTED_RECOMMENDATION for an excellent business', () => {
    const excellent: TrustInputs = {
      verificationLevel: 5,
      averageRating: 4.8,
      reviewCount: 50,
      verifiedReviewCount: 40,
      completedBookingsCount: 48,
      totalBookingsCount: 50,
      averageResponseTimeHours: 1,
      complaintCount: 0,
      resolvedComplaintCount: 0,
      lastActivityDaysAgo: 2,
      partnerTrustWeight: 1.8,
    };
    const result = computeTrustScore(excellent);
    expect(result.total).toBeGreaterThanOrEqual(TRUST_THRESHOLDS.MIN_FOR_TRUSTED_RECOMMENDATION);
  });

  it('stays below MIN_FOR_AI_DISPLAY for a brand-new unverified listing', () => {
    const newListing: TrustInputs = {
      verificationLevel: 0,
      averageRating: null,
      reviewCount: 0,
      verifiedReviewCount: 0,
      completedBookingsCount: 0,
      totalBookingsCount: 0,
      averageResponseTimeHours: null,
      complaintCount: 0,
      resolvedComplaintCount: 0,
      lastActivityDaysAgo: 1,
      partnerTrustWeight: 0.5,
    };
    const result = computeTrustScore(newListing);
    expect(result.total).toBeLessThan(TRUST_THRESHOLDS.MIN_FOR_AI_DISPLAY);
  });

  it('includes partner-verified in explanation at level 5+', () => {
    const result = computeTrustScore({ ...baseInputs, verificationLevel: 5 });
    expect(result.explanation).toContain('partner-verified');
  });

  it('includes highly-rated in explanation for avg rating >= 4.5', () => {
    const result = computeTrustScore({ ...baseInputs, averageRating: 4.8 });
    expect(result.explanation).toContain('highly-rated');
  });

  it('includes proven-track-record for 20+ completed bookings', () => {
    const result = computeTrustScore({ ...baseInputs, completedBookingsCount: 20 });
    expect(result.explanation).toContain('proven-track-record');
  });

  it('includes recently-active for activity within 7 days', () => {
    const result = computeTrustScore({ ...baseInputs, lastActivityDaysAgo: 5 });
    expect(result.explanation).toContain('recently-active');
  });

  it('returns basic-listing explanation when no signals qualify', () => {
    const result = computeTrustScore({
      verificationLevel: 1,
      averageRating: 3.0,
      reviewCount: 2,
      verifiedReviewCount: 0,
      completedBookingsCount: 5,
      totalBookingsCount: 10,
      averageResponseTimeHours: 36,
      complaintCount: 1,
      resolvedComplaintCount: 0,
      lastActivityDaysAgo: 60,
      partnerTrustWeight: 0.5,
    });
    expect(result.explanation).toBe('basic-listing');
  });

  it('weights verification at 30% — changing level 0→3 lifts score by ~16pts', () => {
    const low  = computeTrustScore({ ...baseInputs, verificationLevel: 0 });
    const high = computeTrustScore({ ...baseInputs, verificationLevel: 3 });
    // verification(0)=0, verification(3)=55 → diff = 55 * 0.30 ≈ 16.5
    expect(high.total - low.total).toBeCloseTo(16, 0);
  });

  it('total matches manual weighted sum of components', () => {
    const r = computeTrustScore(baseInputs);
    const manual = Math.round(
      r.verificationScore      * 0.30 +
      r.reviewQualityScore     * 0.20 +
      r.transactionScore       * 0.20 +
      r.responseTimeScore      * 0.10 +
      r.complaintHistoryScore  * 0.10 +
      r.freshnessScore         * 0.05 +
      r.partnerConfidenceScore * 0.05,
    );
    expect(r.total).toBe(manual);
  });
});

// ─── TRUST_THRESHOLDS constants ───────────────────────────────────────────────
describe('TRUST_THRESHOLDS', () => {
  it('MIN_FOR_AI_DISPLAY is 40', () => {
    expect(TRUST_THRESHOLDS.MIN_FOR_AI_DISPLAY).toBe(40);
  });

  it('MIN_FOR_TRUSTED_RECOMMENDATION is 70', () => {
    expect(TRUST_THRESHOLDS.MIN_FOR_TRUSTED_RECOMMENDATION).toBe(70);
  });

  it('VERIFIED is 55', () => {
    expect(TRUST_THRESHOLDS.VERIFIED).toBe(55);
  });
});
