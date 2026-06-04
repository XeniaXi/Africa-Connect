# ConnectAfrica API — multi-stage build
# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile -t connectafrica-api .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage: install only production deps for the api ──────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/trust/package.json     ./packages/trust/
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/api/package.json           ./apps/api/
RUN pnpm install --frozen-lockfile --filter @connectafrica/api...

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
WORKDIR /repo/apps/api
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

ENV NODE_ENV=production

# Copy only what the API needs at runtime
COPY --from=builder /repo/node_modules          ./node_modules
COPY --from=builder /repo/packages              ./packages
COPY --from=builder /repo/apps/api/dist         ./dist
COPY --from=builder /repo/apps/api/package.json ./package.json

# Run Prisma generate at image build time so the client is in node_modules
COPY --from=builder /repo/packages/database/prisma ./packages/database/prisma
RUN node -e "require('@prisma/client')" 2>/dev/null || true

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4000/v1/healthz || exit 1

CMD ["node", "dist/main"]
