// Business discovery types exposed through MCP and REST
export interface BusinessSearchResult {
  businessId: string;
  displayName: string;
  category: string;
  locationSummary: string;
  verificationLevel: number;
  trustScore: number;
  rating: number | null;
  availabilityStatus: string;
  rankingReason: string;
}

export interface FindBusinessInput {
  category?: string;
  intent?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  verifiedOnly?: boolean;
  limit?: number;
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
}

export interface PartnerUpsertPayload {
  externalId: string;
  displayName: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  city: string;
  state: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  services?: string[];
  verification?: {
    partnerVerified: boolean;
    verificationNotes?: string;
  };
}

export interface McpToolResult<T = unknown> {
  data: T;
  confidence: number;
  source: string;
  cached: boolean;
}

export interface RequestContext {
  requestId: string;
  actorId?: string;
  actorType: 'USER' | 'PARTNER' | 'ADMIN' | 'AGENT' | 'SYSTEM';
  tenantId?: string;
  scopes: string[];
  ipAddress?: string;
  userAgent?: string;
}
