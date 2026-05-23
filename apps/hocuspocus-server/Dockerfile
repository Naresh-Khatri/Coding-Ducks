# Build from the monorepo root:
#   docker build -f apps/hocuspocus-server/Dockerfile -t codingducks-hocuspocus .

# ============================================
# STAGE 1: Base
# ============================================
FROM node:23-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

# Chromium provides the binary at /usr/bin/chromium plus its runtime libs,
# which preview.ts prefers over the bundled @sparticuz/chromium fallback.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    chromium \
    fonts-liberation && \
    corepack enable && \
    apt-get clean && \
    rm -rf /var/cache/apt/* /var/lib/apt/lists/* /tmp/*

# ============================================
# STAGE 2: Install dependencies
# ============================================
FROM base AS deps

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
COPY apps/hocuspocus-server/package.json apps/hocuspocus-server/
COPY packages/api/package.json packages/api/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/storage/package.json packages/storage/
COPY packages/validators/package.json packages/validators/
COPY tooling/eslint/package.json tooling/eslint/
COPY tooling/github/package.json tooling/github/
COPY tooling/prettier/package.json tooling/prettier/
COPY tooling/tailwind/package.json tooling/tailwind/
COPY tooling/typescript/package.json tooling/typescript/

RUN pnpm install --frozen-lockfile

# ============================================
# STAGE 3: Build
# ============================================
FROM deps AS builder

WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV SKIP_ENV_VALIDATION=1
RUN pnpm -F hocuspocus-server build

# ============================================
# STAGE 4: Runtime
# ============================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs hocuspocus

COPY --from=builder /app/apps/hocuspocus-server/dist ./apps/hocuspocus-server/dist
COPY --from=builder /app/apps/hocuspocus-server/package.json ./apps/hocuspocus-server/package.json
COPY --from=builder /app/apps/hocuspocus-server/node_modules ./apps/hocuspocus-server/node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER hocuspocus

EXPOSE 5000

ENV PORT=5000

CMD ["node", "apps/hocuspocus-server/dist/index.js"]
