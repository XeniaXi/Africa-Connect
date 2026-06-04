# ConnectAfrica — Agent Context

> Read this before touching any code.

## What this is
ConnectAfrica is an enterprise-grade AI discovery, trust and transaction layer for African businesses.
The MCP gateway lets AI agents (Claude, Gemini, GPT, etc.) find, verify and transact with Nigerian businesses.

## Monorepo structure
```
apps/api        — NestJS REST API (port 4000)
apps/mcp        — MCP Gateway, Streamable HTTP (port 4001)
apps/web        — Next.js 14 App Router — claim portal + public search
apps/admin      — Next.js 14 App Router — internal admin console
packages/database  — Prisma schema + client (PostgreSQL)
packages/types     — Shared TypeScript interfaces
packages/trust     — Trust score algorithm (pure TS, no framework)
packages/config    — Shared env helpers
```

## Architecture rules
1. **Never bypass the auth/policy layer.** Every API endpoint must check scopes. Every MCP tool call is audited.
2. **Prisma is the only ORM.** Do not write raw SQL except in migrations.
3. **Trust score is in `packages/trust`.** Do not duplicate the algorithm in apps.
4. **Audit logs are mandatory.** Every write operation must produce an AuditLog record.
5. **No direct DB access from MCP.** The MCP gateway calls the REST API — it never imports `@connectafrica/database` directly.
6. **Append-only verification history.** Never delete VerificationRecord or TrustScoreHistory rows.
7. **Partner data isolation.** Row-level tenant isolation is required before any partner goes live.

## Running locally
```bash
# Start infrastructure
docker compose -f docker/docker-compose.yml up -d

# Copy env
cp .env.example .env

# Install deps
pnpm install

# Run migrations
pnpm db:migrate:dev

# Start all services
pnpm dev
```

## Key domain concepts
- **Business** — any African business entity. Has locations, services, verification records, trust score.
- **VerificationLevel** — 0 (unverified) to 6 (ConnectAfrica Certified). Never decrease.
- **TrustScore** — 0-100, computed from 7 weighted signals. Minimum 40 for AI display, 70 for trusted recommendation.
- **PartnerSource** — data contributor (SortAm, MediSeen, CSV upload, etc.). Has trustWeight.
- **Lead** — customer intent routed to a business. Created by MCP agents.
- **Booking** — confirmed service appointment. Status: PENDING → CONFIRMED → COMPLETED.
- **AuditLog** — immutable record of every write. Includes actorId, actorType, scopes.

## MCP tools (apps/mcp)
- `find_business` — search by category, city, intent
- `get_business_profile` — full profile by ID
- `verify_business` — verification level + trust signals
- `create_lead` — route customer lead to business
- `list_categories` — supported categories

## API namespaces (apps/api, prefix /v1)
- `/businesses` — CRUD
- `/search` — POST intent search
- `/claims` — claim portal
- `/partner/businesses` — partner ingestion
- `/leads` — lead management
- `/verification` — OTP + document verification
- `/admin/*` — internal tools
- `/healthz` — health check

## Coding conventions
- TypeScript strict mode everywhere
- Zod for all external input validation
- NestJS modules — one module per domain
- No `any` types except in legacy migration scripts
- All new endpoints need a Swagger decorator (@ApiOperation, @ApiTags)
- Tests live next to source files (`*.spec.ts`)

## Agent handoff protocol
When picking up work:
1. Check `PLAN.md` for current phase and pending tasks
2. Check git log: `git log --oneline -20`
3. Run `pnpm typecheck` to find any broken types
4. Read the relevant module before editing
5. Mark tasks complete in PLAN.md after finishing

## Environment variables
See `.env.example` for all required variables. Never commit `.env`.
