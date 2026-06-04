# ConnectAfrica MCP Gateway — multi-stage build
# Build context must be the monorepo root:
#   docker build -f apps/mcp/Dockerfile -t connectafrica-mcp .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json     ./packages/types/
COPY packages/config/package.json    ./packages/config/
COPY apps/mcp/package.json           ./apps/mcp/
RUN pnpm install --frozen-lockfile --filter @connectafrica/mcp...

# ── build stage ───────────────────────────────────────────────────────────────
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/mcp/  ./apps/mcp/
WORKDIR /repo/apps/mcp
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /repo/node_modules     ./node_modules
COPY --from=builder /repo/apps/mcp/dist    ./dist
COPY --from=builder /repo/apps/mcp/package.json ./package.json

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:4001/healthz || exit 1

CMD ["node", "dist/src/server.js"]
