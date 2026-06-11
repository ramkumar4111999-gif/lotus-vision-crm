#!/bin/bash
# CRM Keepalive & Health Check Script
# Run this via cron every 5 minutes or on-demand

cd /home/z/my-project

# Kill stale processes
pkill -f "node server" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
fuser -k 3000/tcp 2>/dev/null
sleep 2

# Start server with respawn loop
setsid bash -c 'while true; do node server.js 2>&1; sleep 3; done' > /tmp/srv.log 2>&1 &
SRV_PID=$!
echo "Server watchdog PID: $SRV_PID"

# Wait for server
for i in $(seq 1 20); do
  if curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ 2>/dev/null | grep -q 200; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

# Start tunnel
pkill -f cloudflared 2>/dev/null
sleep 1
nohup /tmp/cloudflared tunnel --url http://127.0.0.1:3000 > /tmp/tunnel.log 2>&1 &
TUNNEL_PID=$!
echo "Tunnel PID: $TUNNEL_PID"

# Wait for tunnel URL
sleep 10
TUNNEL_URL=$(grep -oP 'https://[a-z0-9\-]+\.trycloudflare\.com' /tmp/tunnel.log 2>/dev/null | head -1)

if [ -n "$TUNNEL_URL" ]; then
  echo "TUNNEL_URL=$TUNNEL_URL"
else
  echo "TUNNEL_URL=NOT_READY"
fi

# Health check
DASH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/api/dashboard 2>/dev/null)
echo "DASHBOARD_API=$DASH_STATUS"

# Log
echo "$(date -Iseconds) | Server=$DASH_STATUS | Tunnel=$TUNNEL_URL" >> /tmp/crm-health.log