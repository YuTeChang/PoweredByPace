#!/bin/bash
# Run migration using Vercel environment variables
# This pulls env vars from Vercel and runs the migration locally
# Usage: ./scripts/migrate-via-vercel.sh

set -e

echo "🔄 Running migration via Vercel CLI"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "❌ Vercel CLI not found"
  echo "Install it with: npm install -g vercel"
  exit 1
fi

# Check if logged in
if ! vercel whoami &> /dev/null; then
  echo "⚠️  Not logged in to Vercel"
  echo "Logging in..."
  vercel login
fi

echo "📥 Pulling environment variables from Vercel..."
TEMP_ENV=$(mktemp)
if vercel env pull "$TEMP_ENV" 2>/dev/null; then
  echo "✅ Environment variables pulled"
  
  # Export the variables
  set -a
  source "$TEMP_ENV"
  set +a
  
  # Clean up temp file
  rm "$TEMP_ENV"
  
  echo ""
  echo "🔄 Running migration with Vercel environment variables..."
  echo ""
  
  # Run the migration script
  node scripts/run-migration.js
  
else
  echo "❌ Failed to pull environment variables"
  echo ""
  echo "Alternative: Set POSTGRES_URL_NON_POOLING manually and run:"
  echo "  POSTGRES_URL_NON_POOLING=your_connection_string node scripts/run-migration.js"
  exit 1
fi

