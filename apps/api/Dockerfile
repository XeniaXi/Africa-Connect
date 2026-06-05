# ConnectAfrica API — multi-stage build
# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile -t connectafrica-api .

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
# pnpm workspace requires ALL member package.json files to be present
# or it falls back to root-only install and never hoists workspace deps like prisma
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/trust/package.json     ./packages/trust/
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY packages/ingest/package.json    ./packages/ingest/
COPY apps/api/package.json           ./apps/api/
COPY apps/web/package.json           ./apps/web/
COPY apps/admin/package.json         ./apps/admin/
COPY apps/mcp/package.json           ./apps/mcp/
RUN pnpm install --frozen-lockfile

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
# Generate Prisma client BEFORE nest build — prisma CLI is now in node_modules/.bin/
RUN ./node_modules/.bin/prisma generate --schema=packages/database/prisma/schema.prisma
WORKDIR /repo/apps/api
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/node_modules                 ./node_modules
COPY --from=builder /repo/packages                     ./packages
COPY --from=builder /repo/apps/api/dist                ./dist
COPY --from=builder /repo/apps/api/package.json        ./package.json

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/v1/healthz || exit 1

CMD ["node", "dist/main"]
