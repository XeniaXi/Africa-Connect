# ConnectAfrica — Execution Plan

Last updated: 2026-06-04
Current phase: **Phase 1 — Claim Portal, AI Visibility Score, Searchable Profiles**

> Core message: **"Make Your Business Discoverable by AI."** Never lead with MCP or API.
> Growth flywheel: AI Searches → Businesses Found → Businesses Claim Profiles → Profiles Improve → Better Results → More AI Usage → More Businesses Join

---

## Phase 1 — Claim Portal + AI Visibility + Searchable Profiles (Target: 2026-07-04)

### Business Registry & Data
- [x] Prisma schema — Business, Location, Category, VerificationRecord, TrustScore
- [x] Seed script (70 businesses — artisans, hospitals, clinics)
- [ ] Run migrations + seed staging DB
- [ ] CSV import endpoint with field mapper
- [ ] Trust score computed on every upsert

### Claim Portal (apps/web)
- [ ] Homepage: "Is Your Business Visible to AI?" hero CTA
- [ ] Business search → public profile page (`/business/[slug]`)
- [ ] "Claim This Business" button on every profile
- [ ] Claim flow: OTP phone verification → manage listing
- [ ] SEO: sitemap.xml, structured data (schema.org/LocalBusiness), meta per profile

### AI Visibility Score
- [ ] Score card shown on every business profile (4 components):
  - Google Visibility (placeholder linking to Search Console)
  - Facebook Visibility (placeholder linking to Meta Business)
  - ConnectAfrica Visibility (derived from profile completeness)
  - AI Discovery Score (trust score × verification weight)
- [ ] Store AI Visibility Score in DB alongside trust score
- [ ] Score improves when business claims + verifies + completes profile

### Infrastructure
- [x] Docker Compose stack (PostGIS, Redis, OpenSearch, MinIO)
- [x] NestJS API scaffold (port 4000)
- [x] MCP Gateway scaffold (port 4001)
- [x] GitHub Actions CI (lint + typecheck + test + build)
- [x] Coolify deploy on push to main
- [ ] Deploy Phase 1 to staging

---

## Phase 2 — Partner Integrations + Automated Profile Creation (Target: 2026-08-04)
- [ ] Partner ingestion API — upsert, batch, webhooks
- [ ] SortAm sync — every artisan auto-gets a ConnectAfrica profile
- [ ] MediSeen sync — every hospital auto-gets a healthcare profile
- [ ] Google Sheets sync
- [ ] ConnectAfrica Agent for bulk CSV upload
- [ ] OpenSearch indexing pipeline
- [ ] Lead creation and routing
- [ ] Email outreach pipeline for unclaimed profiles

---

## Phase 3 — AI Search APIs + MCP Layer + Referral Analytics (Target: 2026-09-04)
- [ ] MCP gateway hardened (auth, rate limit, audit)
- [ ] Booking layer
- [ ] Referral analytics (track which AI agent sent which lead)
- [ ] MediSeen clinic booking integration
- [ ] Public beta launch

---

## Hackathon targets

### UiPath AgentHack — Deadline 2026-06-29, $50k
- Demo: AI agent finds a verified artisan via MCP → creates a lead → business gets notified
- Minimum viable: `find_business` MCP tool + 50 seeded artisans + claim portal live
- Status: Phase 1 must be deployed by June 25

### Gemini XPRIZE — Deadline 2026-08-17, $2M
- Via Klasng.com (existing school management system)
- Angle: AI-powered school operations + ConnectAfrica school discovery layer
- Status: Phase 2 must include school partner integration by August 1

---

## Acquisition Channels (Phase 1 priority)
1. AI discovery landing pages — every profile is a landing page indexed by AI crawlers
2. Public business datasets and directories — import and create unclaimed profiles
3. SortAm auto-profiles (Phase 2)
4. MediSeen auto-profiles (Phase 2)
5. Email outreach to discovered unclaimed businesses
6. Partner platform integrations (schools, pharmacies, estates)

## Claiming Funnel
`Homepage` → `"Is Your Business Visible to AI?"` → `Search Business` → `View Profile` → `Claim Profile` → `OTP Verification` → `Manage Listing`
