const { createServer } = require('http');
const { parse } = require('url');

const PORT = 3000;
let nextApp = null;
let nextHandler = null;
let isRestarting = false;

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
        res.writeHead(502);
        res.end('Bad Gateway');
      }
    });

    await prepare;
    await new Promise((resolve) => server.listen(PORT, '0.0.0.0', resolve));
    console.log(`Custom Next.js server running on http://0.0.0.0:${PORT}`);
    
    server.on('error', (err) => {
      console.error('Server error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('Init error:', err.message);
    process.exit(1);
  }
}

initNext().catch(console.error);
