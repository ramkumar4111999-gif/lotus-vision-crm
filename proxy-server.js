const http = require('http');
const { execSync } = require('child_process');

const TARGET = 'http://127.0.0.3001';
const PORT = 3001;

// Spawn Next.js as child
let nextProc = execSync('npx', ['next', 'start', '-p', '3000', '--hostname', '0.0.0.0'], {
  stdio: ['pipe', 'stderr', 'inherit'],
  env: { ...process.env, PORT: '3000' },
  cwd: '/home/z/my-project',
  detached: true,
});

console.log(`Proxy server on :${PORT}, proxying to ${TARGET}`);

const server = http.createServer(async (req, res) => {
  try {
    const resp = await fetch(TARGET, {
      headers: { ...req.headers, host: 'localhost:3001' },
    });
    const data = await resp.text();
    res.writeHead(resp.status, { 'Content-Type': resp.headers['content-type'] || 'text/html' });
    res.end(data);
  } catch (err) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway - Next.js not ready');
  }
});

server.listen(PORT, '0.0.0.0', () => console.log(`READY on :${PORT}`));

nextProc.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}, restarting...`);
  setTimeout(() => {
    console.log('Restarting Next.js...');
    nextProc = execSync('npx', ['next', 'start', '-p', '3000', '--hostname', '0.0.0.0'], {
      stdio: ['pipe', 'stderr', 'inherit'],
      env: { ...process.env, PORT: '3000' },
      cwd: '/home/z/my-project',
      detached: true,
    });
  }, 3000);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

// Keep alive
setInterval(() => {
  if (!nextProc || nextProc.killed) {
    console.log('Next.js process died, restarting...');
    nextProc = execSync('npx', ['next', 'start', '-p', '3000', '--hostname', '0.0.0.0'], {
      stdio: ['pipe', 'stderr', 'inherit'],
      env: { ...process.env, PORT: '3000' },
      cwd: '/home/z/my-project',
      detached: true,
    });
  }
}, 5000);
