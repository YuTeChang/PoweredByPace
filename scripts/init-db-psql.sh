#!/bin/bash

# Initialize database schema using psql
# This script reads the connection string from .env.local and runs the SQL schema

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"
SQL_FILE="$SCRIPT_DIR/init-db-schema.sql"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Error: .env.local not found"
  echo "   Please run: vercel env pull .env.local"
  exit 1
fi

# Extract POSTGRES_URL_NON_POOLING from .env.local
POSTGRES_URL=$(grep "POSTGRES_URL_NON_POOLING" "$ENV_FILE" | cut -d'"' -f2)

if [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: POSTGRES_URL_NON_POOLING not found in .env.local"
  exit 1
fi

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
  echo "❌ Error: SQL schema file not found: $SQL_FILE"
  exit 1
fi

echo "🗄️  Initializing database schema..."
echo "📡 Connecting to database..."
echo ""

# Execute SQL file using psql
psql "$POSTGRES_URL" -f "$SQL_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Database schema initialized successfully!"
  echo ""
  echo "📚 Next steps:"
  echo "   1. Your database is ready to use"
  echo "   2. Start the app: npm run dev"
  echo "   3. Create a session and test it"
else
  echo ""
  echo "❌ Failed to initialize database"
  exit 1
fi


