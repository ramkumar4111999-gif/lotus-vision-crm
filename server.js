const { createServer } = require('http');
const { parse } = require('url');
const { execSync } = require('child_process');

const PORT = 3000;
let nextApp = null;
let nextHandler = null;
let server = null;

async function initNext() {
  try {
    // Clean up old server
    if (server) {
      try { server.close(); } catch(e) {}
    }

    const next = require('next');
    nextApp = next({ dev: false, hostname: '0.0.0.0', port: PORT });
    const prepare = nextApp.prepare();
    
    server = createServer(async (req, res) => {
      try {
        if (!nextHandler) {
          nextHandler = nextApp.getRequestHandler();
        }
        const parsedUrl = parse(req.url, true);
        await nextHandler(req, res, parsedUrl);
      } catch (err) {
        console.error('Request error:', err.message);
        if (!res.headersSent) {
          res.writeHead(502);
          res.end('Bad Gateway');
        }
      }
    });

    await prepare;
    await new Promise((resolve, reject) => {
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`Port ${PORT} in use, killing and retrying...`);
          try {
            execSync(`fuser -k ${PORT}/tcp 2>/dev/null`, { timeout: 5000 });
          } catch(e) {}
          setTimeout(() => {
            server.close();
            initNext();
          }, 3000);
        } else {
          console.error('Server error:', err.message);
          reject(err);
        }
      });
      server.listen(PORT, '0.0.0.0', () => {
        console.log(`Custom Next.js server running on http://0.0.0.0:${PORT}`);
        resolve(undefined);
      });
    });

    // Lightweight keepalive - just write to stdout to show liveness
    setInterval(() => {
      const now = new Date().toISOString().slice(11, 19);
      process.stdout.write(`[${now}] keepalive\n`);
    }, 60000);

  } catch (err) {
    console.error('Init error:', err.message);
    console.log('Restarting in 5s...');
    setTimeout(initNext, 5000);
  }
}

// Handle process signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  if (server) server.close();
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err.message);
  setTimeout(initNext, 3000);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

initNext().catch((err) => {
  console.error('Fatal:', err.message);
  setTimeout(initNext, 5000);
});