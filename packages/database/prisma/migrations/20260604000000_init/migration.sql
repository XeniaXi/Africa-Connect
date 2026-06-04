-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING_REVIEW');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('USER', 'PARTNER', 'ADMIN', 'AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "apiKeyHash" TEXT,
    "trustWeight" DECIMAL(65,30) NOT NULL DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "webhookUrl" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "businesses" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "sourceId" TEXT,
    "canonicalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "status" "BusinessStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationLevel" INTEGER NOT NULL DEFAULT 0,
    "trustScore" INTEGER NOT NULL DEFAULT 0,
    "availabilityStatus" TEXT NOT NULL DEFAULT 'unknown',
    "lastVerifiedAt" TIMESTAMP(3),
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_locations" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "geohash" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_services" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "displayName" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "scopes" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_claims" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "claimantUserId" TEXT,
    "claimMethod" TEXT NOT NULL,
    "claimStatus" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "evidenceUrl" TEXT,
    "evidenceNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_records" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT,
    "evidence" JSONB,
    "verifiedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "sourceId" TEXT,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "verifiedTransaction" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_score_history" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "verificationScore" DECIMAL(65,30) NOT NULL,
    "reviewQualityScore" DECIMAL(65,30) NOT NULL,
    "transactionScore" DECIMAL(65,30) NOT NULL,
    "responseTimeScore" DECIMAL(65,30) NOT NULL,
    "complaintHistoryScore" DECIMAL(65,30) NOT NULL,
    "freshnessScore" DECIMAL(65,30) NOT NULL,
    "partnerConfidenceScore" DECIMAL(65,30) NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_score_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "serviceNote" TEXT,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "sourceChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "sourceChannel" TEXT,
    "sourcePartner" TEXT,
    "convertedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_events" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "category" TEXT,
    "city" TEXT,
    "state" TEXT,
    "resultCount" INTEGER NOT NULL,
    "topBusinessId" TEXT,
    "actorId" TEXT,
    "actorType" "ActorType" NOT NULL DEFAULT 'AGENT',
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "recordsTotal" INTEGER NOT NULL,
    "recordsUpserted" INTEGER NOT NULL,
    "recordsErrors" INTEGER NOT NULL DEFAULT 0,
    "errorDetails" JSONB,
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "actorId" TEXT,
    "actorType" "ActorType" NOT NULL DEFAULT 'SYSTEM',
    "tenantId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "scopes" TEXT[],
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "partner_sources_name_key" ON "partner_sources"("name");

-- CreateIndex
CREATE UNIQUE INDEX "partner_sources_slug_key" ON "partner_sources"("slug");

-- CreateIndex
CREATE INDEX "businesses_categoryId_idx" ON "businesses"("categoryId");

-- CreateIndex
CREATE INDEX "businesses_trustScore_idx" ON "businesses"("trustScore");

-- CreateIndex
CREATE INDEX "businesses_verificationLevel_idx" ON "businesses"("verificationLevel");

-- CreateIndex
CREATE UNIQUE INDEX "businesses_sourceId_externalId_key" ON "businesses"("sourceId", "externalId");

-- CreateIndex
CREATE INDEX "business_locations_businessId_idx" ON "business_locations"("businessId");

-- CreateIndex
CREATE INDEX "business_locations_city_state_idx" ON "business_locations"("city", "state");

-- CreateIndex
CREATE INDEX "business_locations_geohash_idx" ON "business_locations"("geohash");

-- CreateIndex
CREATE INDEX "business_services_businessId_idx" ON "business_services"("businessId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "business_claims_businessId_idx" ON "business_claims"("businessId");

-- CreateIndex
CREATE INDEX "business_claims_claimStatus_idx" ON "business_claims"("claimStatus");

-- CreateIndex
CREATE INDEX "verification_records_businessId_idx" ON "verification_records"("businessId");

-- CreateIndex
CREATE INDEX "verification_records_verificationStatus_idx" ON "verification_records"("verificationStatus");

-- CreateIndex
CREATE INDEX "reviews_businessId_idx" ON "reviews"("businessId");

-- CreateIndex
CREATE INDEX "reviews_rating_idx" ON "reviews"("rating");

-- CreateIndex
CREATE INDEX "trust_score_history_businessId_idx" ON "trust_score_history"("businessId");

-- CreateIndex
CREATE INDEX "bookings_businessId_idx" ON "bookings"("businessId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "leads_businessId_idx" ON "leads"("businessId");

-- CreateIndex
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- CreateIndex
CREATE INDEX "search_events_category_city_idx" ON "search_events"("category", "city");

-- CreateIndex
CREATE INDEX "search_events_actorType_idx" ON "search_events"("actorType");

-- CreateIndex
CREATE INDEX "sync_logs_sourceId_idx" ON "sync_logs"("sourceId");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resourceId_idx" ON "audit_logs"("resource", "resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "partner_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_locations" ADD CONSTRAINT "business_locations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_services" ADD CONSTRAINT "business_services_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_claimantUserId_fkey" FOREIGN KEY ("claimantUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_records" ADD CONSTRAINT "verification_records_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_score_history" ADD CONSTRAINT "trust_score_history_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_events" ADD CONSTRAINT "search_events_topBusinessId_fkey" FOREIGN KEY ("topBusinessId") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "partner_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

