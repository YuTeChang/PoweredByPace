#!/bin/bash
# Check Vercel deployment logs for migration errors
# Usage: ./scripts/check-migration-logs.sh [deployment-url-or-id]

set -e

DEPLOYMENT="${1:-}"

if [ -z "$DEPLOYMENT" ]; then
  echo "📋 Listing recent deployments..."
  echo ""
  
  # Show recent deployments
  DEPLOYMENT_LIST=$(vercel ls 2>/dev/null | head -10 || echo "")
  
  if [ -n "$DEPLOYMENT_LIST" ]; then
    echo "Recent deployments:"
    echo "$DEPLOYMENT_LIST"
    echo ""
  fi
  
  echo "❌ Please provide deployment URL or ID"
  echo ""
  echo "Usage:"
  echo "  npm run migrate:check https://your-app.vercel.app"
  echo "  or"
  echo "  ./scripts/check-migration-logs.sh https://your-app.vercel.app"
  echo ""
  echo "You can also use your production URL from Vercel dashboard"
  exit 1
fi

echo ""
echo "📜 Fetching logs (last 5 minutes)..."
echo ""

# Fetch logs and filter for migration-related content
LOGS=$(vercel logs "$DEPLOYMENT" 2>&1)

if [ $? -eq 0 ]; then
  echo "Migration-related logs:"
  echo "$LOGS" | grep -i -E "(migration|error|failed|success|migrate|\[Migration\])" || echo "No migration-related logs found in recent output"
  
  echo ""
  echo "Full logs (last 20 lines):"
  echo "$LOGS" | tail -20
else
  echo "❌ Failed to fetch logs"
  echo "Error output:"
  echo "$LOGS"
  exit 1
fi

echo ""
echo "💡 Tip: To see all logs without filtering:"
echo "   vercel logs $DEPLOYMENT"

