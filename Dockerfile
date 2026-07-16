# Lumen LMS — production image for CranL (Dockerfile build type) or any Docker host.
# Multi-stage: install deps → build Next.js → lean runner that migrates on boot.

FROM node:20-bookworm-slim AS base
WORKDIR /app
# Prisma needs OpenSSL at build and runtime.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: full install (incl. build tooling) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- build: generate Prisma client + next build ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: what actually ships ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json /app/next.config.ts ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# CranL: set the app "Port" to match this (3000). The app binds 0.0.0.0.
EXPOSE 3000
ENTRYPOINT ["./docker-entrypoint.sh"]
