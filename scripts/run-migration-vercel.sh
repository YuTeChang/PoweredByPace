#!/bin/bash
# Run database migration via Vercel deployment API
# This calls the /api/migrate endpoint on your Vercel deployment
# Usage: ./scripts/run-migration-vercel.sh [deployment-url]

set -e

# Get deployment URL from argument or environment variable
DEPLOYMENT_URL="${1:-${VERCEL_URL:-}}"

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "⚠️  No deployment URL provided"
  echo ""
  echo "Usage:"
  echo "  ./scripts/run-migration-vercel.sh https://your-app.vercel.app"
  echo ""
  echo "Or set VERCEL_URL environment variable:"
  echo "  VERCEL_URL=https://your-app.vercel.app ./scripts/run-migration-vercel.sh"
  echo ""
  echo "You can also use Vercel CLI to get the URL:"
  echo "  vercel ls"
  exit 1
fi

# Remove trailing slash
DEPLOYMENT_URL="${DEPLOYMENT_URL%/}"

echo "🔄 Running migration via Vercel API..."
echo "   Deployment: $DEPLOYMENT_URL"
echo ""

# Call the migration endpoint
echo "📡 Calling POST $DEPLOYMENT_URL/api/migrate..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$DEPLOYMENT_URL/api/migrate" \
  -H "Content-Type: application/json" 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE:/d')

echo ""
echo "Response:"
if command -v jq &> /dev/null; then
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
  echo "$BODY"
fi

echo ""
echo "HTTP Status: $HTTP_CODE"

# Check if successful
if echo "$BODY" | grep -q '"success":true' || [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✅ Migration completed successfully!"
  exit 0
else
  echo ""
  echo "❌ Migration failed"
  exit 1
fi

