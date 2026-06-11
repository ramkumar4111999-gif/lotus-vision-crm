const { createServer } = require('http');
const { parse } = require('url');

const PORT = 3000;
let nextApp = null;
let nextHandler = null;

async function initNext() {
  try {
    const next = require('next');
    nextApp = next({ dev: false, hostname: '0.0.0.0', port: PORT });
    const prepare = nextApp.prepare();
    const server = createServer(async (req, res) => {
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
          console.error(`Port ${PORT} in use, retrying in 3s...`);
          setTimeout(() => {
            server.close();
            initNext();
          }, 3000);
        } else {
          console.error('Server error:', err.message);
          reject(err);
        }
      });
      server.listen(PORT, '0.0.0.0', resolve);
    });
    console.log(`Custom Next.js server running on http://0.0.0.0:${PORT}`);

    // Keep-alive ping every 30s
    setInterval(() => {
      try {
        const req = require('http').get(`http://127.0.0.1:${PORT}/api/dashboard`, (res) => {
          res.resume();
        });
        req.on('error', () => {});
      } catch (e) {}
    }, 30000);

  } catch (err) {
    console.error('Init error:', err.message);
    console.log('Restarting in 5s...');
    setTimeout(initNext, 5000);
  }
}

initNext().catch((err) => {
  console.error('Fatal:', err.message);
  setTimeout(initNext, 5000);
});