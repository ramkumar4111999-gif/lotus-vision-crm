#!/bin/bash
while true; do
  sleep 30
  # Check Next.js
  NEX_ALIVE=$(ss -tlnp | grep ":3000" | head -1)
  if [ -z "$NEX_ALIVE" ]; then
    echo "$(date) - Next.js died, restarting..." >> /tmp/keepalive.log
    pkill -f "node" 2>/dev/null 2>/dev/null
    cd /home/z/my-project
    nohup node proxy-server.js > /tmp/proxy.log 2>&1 &
  </if>
  fi
  
  # Check cloudflared
  CF_ALIVE=$(ps aux | grep cloudflared | grep -v grep | head -1)
  if [ -z "$CF_ALIVE" ]; then
    echo "$(date) - Cloudflared died, restarting..." >> /tmp/keepalive.log
    pkill -f cloudflared 2>/dev/null 2>/dev/null
    cd /home/z/my-project
    cloudflared tunnel --url http://127.0.0.3001 --protocol http2 > /tmp/cf-tunnel.log 2>&1 &
  fi
  fi
  
  sleep 5
  NEX_ALIVE=$(ss -tlnp | grep ":3000" | head -1)
  if [ -z "$NEX_ALIVE" ]; then
    echo "$(date) - Next.js alive on :3000"
  else
    echo "$(date) - Next.js NOT running on :3000 - starting..."
    pkill -f "node" 2>/dev/null 2>/dev/null
    cd /home/z/my-project
    nohup node proxy-server.js > /tmp/proxy.log 2>&1 &
    sleep 10
  fi
  
  # Verify
  HTTP1=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 5 http://127.0.0:3000 2>/dev/null || echo "0")
  HTTP2=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0:81 2>/dev/null || echo "0")
  echo "$(date) - Proxy:$HTTP1 Next:$HTTP2"
