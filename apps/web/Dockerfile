# Build from the monorepo root:
#   docker build -f apps/web/Dockerfile -t codingducks-web .

# ============================================
# STAGE 1: Base
# ============================================
FROM node:23-bookworm-slim AS base

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl && \
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
RUN pnpm -F @acme/nextjs build

# ============================================
# STAGE 4: Runtime
# ============================================
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/packages/db ./packages/db

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
