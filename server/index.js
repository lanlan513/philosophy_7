import { createServer } from 'node:http';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { existsSync, createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const DATA = join(ROOT, 'data');
const DIST = join(ROOT, '..', 'dist');
const PORT = Number(process.env.PORT || 3001);
// 模拟档案馆的慵懒：接口默认带一点延迟，可用 ARCHIVE_LATENCY=0 关闭，
// 也可以用 ?latency=1200 临时拖慢某个请求，验证前端“接口慢于动画”的表现。
const BASE_LATENCY = Number(process.env.ARCHIVE_LATENCY ?? 120);

const words = JSON.parse(await readFile(join(DATA, 'words.json'), 'utf8'));
const philosophers = JSON.parse(await readFile(join(DATA, 'philosophers.json'), 'utf8'));
const echoes = JSON.parse(await readFile(join(DATA, 'echoes.json'), 'utf8'));
const knownWordIds = new Set(words.map((w) => w.id));

const COLLECTIONS_FILE = join(DATA, 'collections.json');
let collections = {};
try {
  collections = JSON.parse(await readFile(COLLECTIONS_FILE, 'utf8'));
} catch { /* 首次运行，文件可能还不存在 */ }

let writeTimer = null;
function persistCollections() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(async () => {
    const tmp = COLLECTIONS_FILE + '.tmp';
    try {
      await mkdir(DATA, { recursive: true });
      await writeFile(tmp, JSON.stringify(collections, null, 2));
      await rename(tmp, COLLECTIONS_FILE);
    } catch (err) {
      console.error('[archive] 收藏写入失败：', err.message);
    }
  }, 150);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(res, status, body, headers = {}) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 64 * 1024) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res, pathname) {
  if (!existsSync(DIST)) return false;
  let file = normalize(join(DIST, pathname === '/' ? 'index.html' : pathname));
  if (!file.startsWith(normalize(DIST))) { send(res, 403, 'forbidden'); return true; }
  if (!existsSync(file)) file = join(DIST, 'index.html'); // SPA 回退
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(res);
  return true;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const { pathname, searchParams } = url;

  try {
    if (pathname === '/api/health') {
      return send(res, 200, { ok: true, specimens: knownWordIds.size });
    }

    if (pathname === '/api/words' && req.method === 'GET') {
      return send(res, 200, { words });
    }

    const echoMatch = pathname.match(/^\/api\/words\/([\w-]+)\/echoes$/);
    if (echoMatch && req.method === 'GET') {
      const id = echoMatch[1];
      const latency = Number(searchParams.get('latency') ?? BASE_LATENCY);
      if (latency > 0) await sleep(Math.min(latency, 5000));
      if (!knownWordIds.has(id)) return send(res, 404, { error: 'unknown specimen' });
      const entry = echoes[id] || { note: '', echoes: [] };
      return send(res, 200, {
        word: id,
        note: entry.note,
        echoes: entry.echoes
          .map((e) => {
            const person = philosophers[e.p];
            return person ? { ...person, id: e.p, quote: e.quote } : null;
          })
          .filter(Boolean),
      });
    }

    if (pathname === '/api/cabinet' && req.method === 'GET') {
      const uid = String(searchParams.get('uid') || '').slice(0, 64);
      const items = Array.isArray(collections[uid]) ? collections[uid] : [];
      return send(res, 200, { uid, items, updatedAt: collections[`${uid}#ts`] || null });
    }

    if (pathname === '/api/cabinet' && req.method === 'PUT') {
      const body = await readBody(req);
      const uid = String(body.uid || '').slice(0, 64);
      if (!uid) return send(res, 400, { error: 'uid required' });
      const items = Array.isArray(body.items)
        ? [...new Set(body.items.filter((id) => knownWordIds.has(id)))].slice(0, 64)
        : [];
      collections[uid] = items;
      collections[`${uid}#ts`] = Date.now();
      persistCollections();
      return send(res, 200, { ok: true, items });
    }

    if (pathname.startsWith('/api/')) return send(res, 404, { error: 'not found' });

    if (req.method === 'GET' && serveStatic(req, res, pathname)) return;
    send(res, 404, '思想档案馆 API 运行中。前端请先执行 npm run build，或使用 npm run dev 启动 Vite。');
  } catch (err) {
    console.error('[archive]', err);
    send(res, 500, { error: 'archive error' });
  }
});

server.listen(PORT, () => {
  console.log(`思想档案馆 · 回声标本柜 API → http://localhost:${PORT}`);
});
