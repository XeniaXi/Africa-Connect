# ConnectAfrica Admin Console — Next.js standalone build
# Build context must be the monorepo root:
#   docker build -f apps/admin/Dockerfile -t connectafrica-admin .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/admin/package.json         ./apps/admin/
RUN pnpm install --frozen-lockfile --filter @connectafrica/admin...

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
WORKDIR /repo/apps/admin
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /repo/apps/admin/.next/standalone ./
COPY --from=builder /repo/apps/admin/.next/static      ./.next/static
COPY --from=builder /repo/apps/admin/public            ./public 2>/dev/null || true

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["node", "server.js"]
