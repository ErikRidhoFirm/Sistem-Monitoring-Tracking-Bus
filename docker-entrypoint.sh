#!/usr/bin/env sh
set -e

if [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="postgresql://${POSTGRES_USER:-buswy}:${POSTGRES_PASSWORD:-buswy}@db:5432/${POSTGRES_DB:-buswy}?schema=public"
fi

# Apply Prisma migrations before starting the server.
bunx --bun prisma migrate deploy

# Seed default admin if missing.
bunx --bun prisma db seed

exec bun server.ts
