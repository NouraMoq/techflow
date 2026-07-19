#!/usr/bin/env sh
# Container entrypoint: apply the DB schema, optionally seed, then start Next.js.
set -e

echo "→ Applying database schema to PostgreSQL…"
if [ -d prisma/migrations ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  # Production-correct: apply committed migrations (no data loss).
  npx prisma migrate deploy
else
  # First bring-up before any migrations are committed: create tables from schema.
  npx prisma db push --skip-generate
fi

if [ "$SEED_ON_START" = "true" ]; then
  echo "→ Seeding demo data…"
  npx tsx prisma/seed.ts || echo "seed skipped (non-fatal)"
fi

echo "→ Starting Next.js on :$PORT"
exec npm run start
