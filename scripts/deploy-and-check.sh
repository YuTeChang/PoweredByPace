#!/bin/bash
# Deploy to Vercel and check migration logs
# Usage: ./scripts/deploy-and-check.sh [--prod|--preview]

set -e

ENV_FLAG="${1:---preview}"

# Validate flag
if [ "$ENV_FLAG" != "--prod" ] && [ "$ENV_FLAG" != "--preview" ]; then
  echo "❌ Invalid flag: $ENV_FLAG"
  echo "Usage: ./scripts/deploy-and-check.sh [--prod|--preview]"
  exit 1
fi

echo "🚀 Deploying to Vercel ($ENV_FLAG)..."
echo ""

# Deploy and capture output
DEPLOY_OUTPUT=$(vercel deploy $ENV_FLAG --yes 2>&1)
DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -ne 0 ]; then
  echo "❌ Deployment failed!"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

# Extract deployment URL from output
# Vercel outputs: "🔗  Preview: https://your-app-xxx.vercel.app"
DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[^[:space:]]+\.vercel\.app' | head -1)

if [ -z "$DEPLOYMENT_URL" ]; then
  # Try alternative format
  DEPLOYMENT_URL=$(echo "$DEPLOY_OUTPUT" | grep -i "preview\|production" | grep -oE 'https://[^[:space:]]+' | head -1)
fi

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "⚠️  Could not extract deployment URL from output"
  echo "Deployment output:"
  echo "$DEPLOY_OUTPUT"
  echo ""
  echo "Please provide the deployment URL manually:"
  read -p "Deployment URL: " DEPLOYMENT_URL
fi

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "❌ No deployment URL provided"
  exit 1
fi

echo "✅ Deployment successful!"
echo "📍 URL: $DEPLOYMENT_URL"
echo ""
echo "⏳ Waiting 5 seconds for build to complete..."
sleep 5

echo ""
echo "📜 Fetching build logs..."
echo ""

# Fetch logs
LOGS=$(vercel logs "$DEPLOYMENT_URL" 2>&1)

if [ $? -eq 0 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🔍 MIGRATION LOGS"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  # Show migration-related logs
  MIGRATION_LOGS=$(echo "$LOGS" | grep -i -E "(migration|\[Migration\]|postbuild|run-migration)" || echo "")
  
  if [ -n "$MIGRATION_LOGS" ]; then
    echo "$MIGRATION_LOGS"
  else
    echo "⚠️  No migration logs found"
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "❌ ERRORS (if any)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  ERROR_LOGS=$(echo "$LOGS" | grep -i -E "(error|failed|✗|❌)" || echo "")
  
  if [ -n "$ERROR_LOGS" ]; then
    echo "$ERROR_LOGS"
  else
    echo "✅ No errors found"
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ SUCCESS MESSAGES"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  
  SUCCESS_LOGS=$(echo "$LOGS" | grep -i -E "(success|✓|✅|completed)" || echo "")
  
  if [ -n "$SUCCESS_LOGS" ]; then
    echo "$SUCCESS_LOGS"
  else
    echo "No explicit success messages"
  fi
  
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "📋 FULL LOGS (last 50 lines)"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "$LOGS" | tail -50
  
else
  echo "❌ Failed to fetch logs"
  echo "Error output:"
  echo "$LOGS"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 TIPS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "To see all logs:"
echo "  vercel logs $DEPLOYMENT_URL"
echo ""
echo "To open deployment in browser:"
echo "  open $DEPLOYMENT_URL"
echo ""
echo "To test migration endpoint:"
echo "  curl -X POST $DEPLOYMENT_URL/api/migrate"
echo ""

