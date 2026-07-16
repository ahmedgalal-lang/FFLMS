#!/bin/sh
# Vercel build: map provider env names, generate client, migrate, optionally
# seed, then build. Kept as a script so the logic is readable and testable.
set -e

export PATH="./node_modules/.bin:$PATH"

# Bridge Vercel+Supabase injected names to the canonical ones Prisma uses.
export DATABASE_URL="${DATABASE_URL:-${POSTGRES_PRISMA_URL:-$POSTGRES_URL}}"
export DIRECT_URL="${DIRECT_URL:-${POSTGRES_URL_NON_POOLING:-$DATABASE_URL}}"

echo "→ prisma generate"
prisma generate

echo "→ prisma migrate deploy"
prisma migrate deploy

# Optional one-time demo data. Set SEED_ON_BUILD=true in the host env, deploy,
# then remove it. The seed is idempotent (upsert by email), so re-runs are safe.
if [ "$SEED_ON_BUILD" = "true" ] || [ "$SEED_ON_BUILD" = "1" ]; then
  echo "→ prisma db seed (SEED_ON_BUILD set)"
  prisma db seed || echo "  seed failed or already applied — continuing"
fi

echo "→ next build"
next build
