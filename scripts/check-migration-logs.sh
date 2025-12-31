#!/bin/bash
# Check Vercel deployment logs for migration errors
# Usage: ./scripts/check-migration-logs.sh [deployment-url-or-id]

set -e

DEPLOYMENT="${1:-}"

if [ -z "$DEPLOYMENT" ]; then
  echo "📋 Getting latest deployment..."
  
  # Try to get deployment ID or URL
  if command -v jq &> /dev/null; then
    DEPLOYMENT_ID=$(vercel ls --json 2>/dev/null | jq -r '.[0].uid' 2>/dev/null || echo "")
    DEPLOYMENT_URL=$(vercel ls --json 2>/dev/null | jq -r '.[0].url' 2>/dev/null || echo "")
  else
    # Fallback: try to parse without jq
    DEPLOYMENT_LIST=$(vercel ls 2>/dev/null | head -5 || echo "")
    if [ -n "$DEPLOYMENT_LIST" ]; then
      echo "Available deployments:"
      echo "$DEPLOYMENT_LIST"
      echo ""
      echo "Please provide deployment URL or ID:"
      echo "  ./scripts/check-migration-logs.sh https://your-app.vercel.app"
      echo "  or"
      echo "  ./scripts/check-migration-logs.sh deployment-id"
      exit 1
    fi
  fi
  
  if [ -n "$DEPLOYMENT_ID" ]; then
    DEPLOYMENT="$DEPLOYMENT_ID"
    echo "   Using deployment ID: $DEPLOYMENT_ID"
  elif [ -n "$DEPLOYMENT_URL" ]; then
    DEPLOYMENT="$DEPLOYMENT_URL"
    echo "   Using deployment URL: $DEPLOYMENT_URL"
  else
    echo "❌ Could not auto-detect deployment"
    echo ""
    echo "Please provide deployment URL or ID:"
    echo "  ./scripts/check-migration-logs.sh https://your-app.vercel.app"
    echo "  or"
    echo "  ./scripts/check-migration-logs.sh deployment-id"
    echo ""
    echo "To see available deployments:"
    echo "  vercel ls"
    exit 1
  fi
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

