#!/bin/bash
# Kill existing processes
pkill -f "next" 2>/dev/null
pkill -f "cloudflared" 2>/dev/null
sleep 2

# Start Next.js (dev mode for hot reload)
cd /home/z/my-project
nohup npx next dev -p 3000 --hostname 0.0.0.0 > /tmp/next-crm.log 2>&1 &
echo "Next.js PID: $!"

# Wait for Next.js to be ready
for i in $(seq 1 20); do
  if ss -tlnp | grep -q ":3000 "; then
    echo "Next.js ready on :3000"
    break
  fi
  sleep 1
done

# Start Cloudflare tunnel
nohup cloudflared tunnel --url http://127.0.0.1:81 > /tmp/cf-crm.log 2>&1 &
echo "Cloudflared PID: $!"

# Wait for tunnel URL
sleep 8
TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/cf-crm.log | head -1)
echo "TUNNEL_URL=$TUNNEL_URL"

# Save URL for reference
echo "$TUNNEL_URL" > /tmp/crm-tunnel-url.txt
