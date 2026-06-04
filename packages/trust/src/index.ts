// Trust Score Algorithm — ConnectAfrica v1
// Explainable weighted score. No black box.
// Score range: 0-100
// Minimum for AI display: 40
// Minimum for trusted recommendation: 70

export interface TrustInputs {
  verificationLevel: number;           // 0-6
  averageRating: number | null;        // 1-5 or null
  reviewCount: number;
  verifiedReviewCount: number;         // reviews with verified_transaction=true
  completedBookingsCount: number;
  totalBookingsCount: number;
  averageResponseTimeHours: number | null;
  complaintCount: number;
  resolvedComplaintCount: number;
  lastActivityDaysAgo: number;
  partnerTrustWeight: number;          // 0.5-2.0 based on partner quality
}

export interface TrustScoreBreakdown {
  total: number;
  verificationScore: number;
  reviewQualityScore: number;
  transactionScore: number;
  responseTimeScore: number;
  complaintHistoryScore: number;
  freshnessScore: number;
  partnerConfidenceScore: number;
  explanation: string;
}

const WEIGHTS = {
  verification: 0.30,
  reviewQuality: 0.20,
  transactionCompletion: 0.20,
  responseTime: 0.10,
  complaintHistory: 0.10,
  freshness: 0.05,
  partnerConfidence: 0.05,
} as const;

export function computeVerificationScore(level: number): number {
  // Level 0=0, 1=20, 2=35, 3=55, 4=70, 5=85, 6=100
  const map: Record<number, number> = { 0: 0, 1: 20, 2: 35, 3: 55, 4: 70, 5: 85, 6: 100 };
  return map[Math.min(level, 6)] ?? 0;
}

export function computeReviewQualityScore(
  averageRating: number | null,
  reviewCount: number,
  verifiedReviewCount: number,
): number {
  if (!averageRating || reviewCount === 0) return 0;
  const ratingScore = ((averageRating - 1) / 4) * 100; // normalize 1-5 to 0-100
  const volumeBonus = Math.min(reviewCount / 20, 1) * 10; // up to +10 for volume
  const verifiedBonus = reviewCount > 0 ? (verifiedReviewCount / reviewCount) * 15 : 0;
  return Math.min(ratingScore + volumeBonus + verifiedBonus, 100);
}

export function computeTransactionScore(
  completed: number,
  total: number,
): number {
  if (total === 0) return 0;
  const completionRate = completed / total;
  const volumeScore = Math.min(total / 50, 1) * 20; // up to +20 for volume
  return Math.min(completionRate * 80 + volumeScore, 100);
}

export function computeResponseTimeScore(avgHours: number | null): number {
  if (avgHours === null) return 0;
  if (avgHours <= 1) return 100;
  if (avgHours <= 4) return 85;
  if (avgHours <= 12) return 65;
  if (avgHours <= 24) return 45;
  if (avgHours <= 48) return 25;
  return 10;
}

export function computeComplaintHistoryScore(
  total: number,
  resolved: number,
  bookings: number,
): number {
  if (total === 0) return 100;
  const resolutionRate = total > 0 ? resolved / total : 1;
  const complaintRate = bookings > 0 ? total / bookings : 0;
  const base = resolutionRate * 80;
  const penalty = Math.min(complaintRate * 200, 40);
  return Math.max(base - penalty, 0);
}

export function computeFreshnessScore(lastActivityDaysAgo: number): number {
  if (lastActivityDaysAgo <= 7) return 100;
  if (lastActivityDaysAgo <= 30) return 80;
  if (lastActivityDaysAgo <= 90) return 60;
  if (lastActivityDaysAgo <= 180) return 40;
  if (lastActivityDaysAgo <= 365) return 20;
  return 5;
}

export function computePartnerConfidenceScore(trustWeight: number): number {
  return Math.min((trustWeight / 2.0) * 100, 100);
}

export function computeTrustScore(inputs: TrustInputs): TrustScoreBreakdown {
  const verification = computeVerificationScore(inputs.verificationLevel);
  const reviewQuality = computeReviewQualityScore(
    inputs.averageRating,
    inputs.reviewCount,
    inputs.verifiedReviewCount,
  );
  const transaction = computeTransactionScore(
    inputs.completedBookingsCount,
    inputs.totalBookingsCount,
  );
  const responseTime = computeResponseTimeScore(inputs.averageResponseTimeHours);
  const complaintHistory = computeComplaintHistoryScore(
    inputs.complaintCount,
    inputs.resolvedComplaintCount,
    inputs.totalBookingsCount,
  );
  const freshness = computeFreshnessScore(inputs.lastActivityDaysAgo);
  const partnerConfidence = computePartnerConfidenceScore(inputs.partnerTrustWeight);

  const total = Math.round(
    verification * WEIGHTS.verification +
    reviewQuality * WEIGHTS.reviewQuality +
    transaction * WEIGHTS.transactionCompletion +
    responseTime * WEIGHTS.responseTime +
    complaintHistory * WEIGHTS.complaintHistory +
    freshness * WEIGHTS.freshness +
    partnerConfidence * WEIGHTS.partnerConfidence,
  );

  const reasons: string[] = [];
  if (inputs.verificationLevel >= 5) reasons.push('partner-verified');
  else if (inputs.verificationLevel >= 3) reasons.push('document-verified');
  if (inputs.averageRating && inputs.averageRating >= 4.5) reasons.push('highly-rated');
  if (inputs.completedBookingsCount >= 20) reasons.push('proven-track-record');
  if (inputs.lastActivityDaysAgo <= 7) reasons.push('recently-active');

  return {
    total,
    verificationScore: verification,
    reviewQualityScore: reviewQuality,
    transactionScore: transaction,
    responseTimeScore: responseTime,
    complaintHistoryScore: complaintHistory,
    freshnessScore: freshness,
    partnerConfidenceScore: partnerConfidence,
    explanation: reasons.length > 0 ? reasons.join(', ') : 'basic-listing',
  };
}

export const TRUST_THRESHOLDS = {
  MIN_FOR_AI_DISPLAY: 40,
  MIN_FOR_TRUSTED_RECOMMENDATION: 70,
  VERIFIED: 55,
} as const;
