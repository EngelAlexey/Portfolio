import http from 'node:http';
import { readFileSync } from 'node:fs';
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '') || 'measure.html';
  let body;
  try { body = readFileSync(p); } catch { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  res.end(body);
}).listen(4599, () => console.log('listo'));
