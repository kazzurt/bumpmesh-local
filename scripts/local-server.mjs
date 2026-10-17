import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const port = Number(process.env.BUMPMESH_PORT || 8765);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.bmp': 'image/bmp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' };
const allowed = new Set(['index.html', 'style.css', 'logo.png', 'js', 'textures', 'vendor', 'assets', 'fonts', 'test-worker.html', 'test-texture-seams.html', 'test-texture-gradient.html']);
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  try {
    const route = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (route === '/__bumpmesh-local-health.json') {
      res.setHeader('Content-Type', 'application/json');
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ app: 'bumpmesh-local', root, pid: process.pid }));
      return;
    }
    const relative = route === '/' ? 'index.html' : route.replace(/^\/+/, '');
    const first = relative.split(/[\\/]/)[0];
    const requested = path.resolve(root, relative);
    if (!allowed.has(first) || !requested.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
    const actual = await realpath(requested);
    if (!actual.startsWith(root + path.sep)) { res.writeHead(404); res.end(); return; }
    const info = await stat(actual);
    if (!info.isFile() || !types[path.extname(actual).toLowerCase()]) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', types[path.extname(actual).toLowerCase()]);
    res.setHeader('Content-Length', info.size);
    res.end(req.method === 'HEAD' ? undefined : await readFile(actual));
  } catch { res.writeHead(404); res.end(); }
});
server.on('error', err => { console.error(`BumpMesh Local: ${err.message}`); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`BumpMesh Local: http://127.0.0.1:${port}\nServing ${root}\nPress Ctrl+C to stop.`));
