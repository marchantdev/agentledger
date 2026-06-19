#!/bin/bash
set -euo pipefail

echo "Building..."
npm run build

echo "Deploying to Vercel..."

deploy_attempt() {
  npx vercel deploy --yes --prod --token="$VERCEL_TOKEN" 2>&1
}

OUTPUT=$(deploy_attempt)
URL=$(echo "$OUTPUT" | grep -Eo 'https://[^ ]+\.vercel\.app' | tail -1)

if [ -z "$URL" ]; then
  echo "First deploy attempt failed. Retrying in 5s..."
  sleep 5
  OUTPUT=$(deploy_attempt)
  URL=$(echo "$OUTPUT" | grep -Eo 'https://[^ ]+\.vercel\.app' | tail -1)
fi

if [ -z "$URL" ]; then
  echo "ERROR: Vercel deploy failed after 2 attempts."
  echo "Output: $OUTPUT"
  echo ""
  echo "Fallback: deploy manually with 'npx vercel' or use another host."
  echo "Then write the URL to deployment-url.txt"
  exit 1
fi

echo "$URL" > deployment-url.txt
echo "Deployed to: $URL"
