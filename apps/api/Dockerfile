# ConnectAfrica API — multi-stage build
# Build context must be the monorepo root:
#   docker build -f apps/api/Dockerfile -t connectafrica-api .

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage: install ALL workspace deps (no filter — prisma CLI must be available) ──
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/api/ ./apps/api/
# Generate Prisma client BEFORE compiling — types must exist for nest build
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
