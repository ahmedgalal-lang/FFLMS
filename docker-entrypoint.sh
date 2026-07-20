#!/bin/sh
# Container startup: apply migrations, optionally seed, then start Next.js.
set -e

# When only a single DATABASE_URL is injected, use it for migrations too.
export DIRECT_URL="${DIRECT_URL:-$DATABASE_URL}"

echo "-> Applying database migrations (prisma migrate deploy)..."
node_modules/.bin/prisma migrate deploy

if [ "$SEED_ON_START" = "true" ] || [ "$SEED_ON_START" = "1" ]; then
  echo "-> Seeding database (SEED_ON_START set)..."
  node_modules/.bin/prisma db seed || echo "  (seed failed or already applied - continuing)"
fi

PORT="${PORT:-3000}"
echo "-> Starting Next.js on 0.0.0.0:${PORT}..."
exec node_modules/.bin/next start -H 0.0.0.0 -p "${PORT}"
