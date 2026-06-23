#!/bin/bash
# Start AgentLedger backend + Cloudflare tunnel
# Captures the tunnel URL to deployment-url.txt

cd "$(dirname "$0")"

# Kill existing processes
pkill -f "node backend/server.js" 2>/dev/null
pkill -f "cloudflared tunnel" 2>/dev/null
sleep 1

# Start backend
node backend/server.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
for i in $(seq 1 10); do
  curl -s http://localhost:3001/api/health > /dev/null 2>&1 && break
  sleep 1
done

# Start tunnel and capture URL
cloudflared tunnel --url http://localhost:3001 2>&1 | while read line; do
  echo "$line"
  URL=$(echo "$line" | grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com')
  if [ -n "$URL" ]; then
    echo "$URL" > deployment-url.txt
    cp deployment-url.txt /opt/autonomous-ai/deployment-url.txt
    echo "TUNNEL URL: $URL"
  fi
done &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

echo "$BACKEND_PID" > .backend.pid
echo "$TUNNEL_PID" > .tunnel.pid

wait
