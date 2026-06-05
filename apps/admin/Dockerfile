# ConnectAfrica Admin Console — Next.js standalone build
# Build context must be the monorepo root:
#   docker build -f apps/admin/Dockerfile -t connectafrica-admin .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
# .npmrc must be copied here so shamefully-hoist=true applies before pnpm install.
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY packages/database/package.json ./packages/database/
COPY packages/trust/package.json     ./packages/trust/
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY packages/ingest/package.json    ./packages/ingest/
COPY apps/api/package.json           ./apps/api/
COPY apps/web/package.json           ./apps/web/
COPY apps/admin/package.json         ./apps/admin/
COPY apps/mcp/package.json           ./apps/mcp/
RUN pnpm install --no-frozen-lockfile

# ── build stage ───────────────────────────────────────────────────────────────
# NEXT_PUBLIC_* vars are baked into the client JS bundle at build time.
# Coolify injects these as ARG + --build-arg when its "auto build args" toggle
# is enabled — do NOT declare them manually here or the build cache breaks.
FROM deps AS builder
ENV NEXT_TELEMETRY_DISABLED=1
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/
WORKDIR /repo/apps/admin
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
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

CMD ["node", "server.js"]
