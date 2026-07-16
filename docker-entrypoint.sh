#!/bin/sh
# Container startup: apply migrations, optionally seed, then start Next.js.
set -e

# CranL-managed Postgres injects a single DATABASE_URL (direct connection).
# Prisma's `directUrl` (used for migrations) falls back to it when DIRECT_URL
# is not separately provided (e.g. Supabase pooled + direct split).
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "→ Applying database migrations (prisma migrate deploy)…"
npx prisma migrate deploy

if [ "$SEED_ON_START" = "true" ] || [ "$SEED_ON_START" = "1" ]; then
  echo "→ Seeding database (SEED_ON_START set)…"
  npx prisma db seed || echo "  (seed failed or already applied — continuing)"
fi

PORT="${PORT:-3000}"
echo "→ Starting Next.js on 0.0.0.0:${PORT}…"
exec npx next start -H 0.0.0.0 -p "${PORT}"
