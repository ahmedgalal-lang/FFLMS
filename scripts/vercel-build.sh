#!/bin/sh
# Vercel build: generate the Prisma client, apply migrations, optionally seed,
# then build Next.js. Env-name bridging for Vercel+Supabase is handled in
# src/config/env.ts (POSTGRES_* -> DATABASE_URL/DIRECT_URL); we mirror it here
# so the Prisma CLI (which reads process env directly) also resolves them.
set -e

export PATH="./node_modules/.bin:$PATH"

export DATABASE_URL="${DATABASE_URL:-${POSTGRES_PRISMA_URL:-$POSTGRES_URL}}"
export DIRECT_URL="${DIRECT_URL:-${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}}"

echo "-> prisma generate"
prisma generate

echo "-> prisma migrate deploy"
prisma migrate deploy

# Optional one-time demo data. Set SEED_ON_BUILD=true in the host env, deploy
# once, then remove it. The seed is idempotent (upsert by email).
if [ "$SEED_ON_BUILD" = "true" ] || [ "$SEED_ON_BUILD" = "1" ]; then
  echo "-> prisma db seed (SEED_ON_BUILD set)"
  prisma db seed || echo "  seed failed or already applied - continuing"
fi

echo "-> next build"
next build
