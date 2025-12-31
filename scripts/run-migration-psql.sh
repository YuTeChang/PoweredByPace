#!/bin/bash
# Run database migration using psql
# Usage: ./scripts/run-migration-psql.sh

set -e

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get connection string (prefer NON_POOLING for migrations)
CONNECTION_STRING="${POSTGRES_URL_NON_POOLING:-${POSTGRES_URL:-${DATABASE_URL}}}"

if [ -z "$CONNECTION_STRING" ]; then
  echo "❌ No connection string found"
  echo "Set POSTGRES_URL_NON_POOLING, POSTGRES_URL, or DATABASE_URL in .env.local"
  exit 1
fi

# Remove sslmode from connection string (we'll handle SSL via psql options)
CLEAN_CONNECTION_STRING=$(echo "$CONNECTION_STRING" | sed 's/[?&]sslmode=[^&]*//g' | sed 's/[?&]supa=[^&]*//g' | sed 's/[?&]pgbouncer=[^&]*//g')

echo "🔄 Running database migration..."
echo "   Connection: ${CLEAN_CONNECTION_STRING:0:30}..."

# Check if connection string contains supabase (needs SSL)
if [[ "$CLEAN_CONNECTION_STRING" == *"supabase"* ]] || [[ "$CLEAN_CONNECTION_STRING" != *"localhost"* ]]; then
  SSL_MODE="require"
else
  SSL_MODE="prefer"
fi

# Run migration using psql
psql "$CLEAN_CONNECTION_STRING?sslmode=$SSL_MODE" -f scripts/migrate-add-groups.sql

echo "✅ Migration completed!"

