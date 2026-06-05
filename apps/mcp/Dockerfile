# ConnectAfrica MCP Gateway — multi-stage build
# Build context must be the monorepo root:
#   docker build -f apps/mcp/Dockerfile -t connectafrica-mcp .

FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /repo

# ── deps stage ────────────────────────────────────────────────────────────────
# .npmrc must be copied here so shamefully-hoist=true applies before pnpm install.
# All workspace member package.json files must be present for pnpm to resolve
# the workspace graph correctly.
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
FROM deps AS builder
COPY packages/ ./packages/
COPY apps/mcp/  ./apps/mcp/
WORKDIR /repo/apps/mcp
RUN pnpm run build

# ── runtime stage ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# node_modules: hoisted deps (express, @modelcontextprotocol/sdk, etc.)
# packages:     workspace package source that node_modules symlinks point into
#               (@connectafrica/types, @connectafrica/trust)
COPY --from=builder /repo/node_modules        ./node_modules
COPY --from=builder /repo/packages            ./packages
COPY --from=builder /repo/apps/mcp/dist       ./dist
COPY --from=builder /repo/apps/mcp/package.json ./package.json

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4001/healthz || exit 1

CMD ["node", "dist/src/server.js"]
