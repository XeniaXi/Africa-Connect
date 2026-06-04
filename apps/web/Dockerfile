# ConnectAfrica Web (claim portal) — Next.js standalone build
# Build context must be the monorepo root:
#   docker build -f apps/web/Dockerfile -t connectafrica-web .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/web/package.json           ./apps/web/
RUN pnpm install --frozen-lockfile --filter @connectafrica/web...

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/web/  ./apps/web/
WORKDIR /repo/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static      ./.next/static
COPY --from=builder /repo/apps/web/public            ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
