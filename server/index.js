'use strict';

/**
 * 回声标本柜 · 轻量服务端（零依赖）
 *
 * 接口：
 *   GET  /api/health                     存活检查
 *   GET  /api/words                      词语标本目录（含布局，不含引文）
 *   GET  /api/words/:id/echoes           一个词的回声：引文 + 人物 + 年代
 *   GET  /api/portraits/:id.svg          哲学家肖像切片（生成的 SVG）
 *   GET  /api/cabinet                    读取我的小柜子（按 x-echo-uid 区分访客）
 *   PUT  /api/cabinet  { items: [...] }  保存我的小柜子
 *
 * 调试参数（任意 /api 接口）：
 *   ?delay=1500  人为延迟毫秒，模拟"接口慢于动画"
 *   ?fail=1      返回 503，模拟接口故障
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WORDS, PHILOSOPHERS, echoesFor, publicWord } = require('./data');
const { portraitSvg } = require('./portraits');

const PORT = Number(process.env.PORT || 4173);
const CLIENT_DIST = path.join(__dirname, '..', 'dist');
const STORE_DIR = path.join(__dirname, 'data-store');
const STORE_FILE = path.join(STORE_DIR, 'cabinets.json');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
};

/* ---------- 收藏持久化（文件不可写时降级为内存） ---------- */

let memoryStore = null; // 文件系统不可用时的兜底

function loadStore() {
  if (memoryStore) return memoryStore;
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function saveStore(store) {
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    const tmp = `${STORE_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store));
    fs.renameSync(tmp, STORE_FILE);
    return true;
  } catch {
    memoryStore = store; // 降级：至少本次进程内不丢
    return false;
  }
}

/* ---------- 工具 ---------- */

function sendJson(res, code, obj) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 100 * 1024) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      data += chunk;
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/* ---------- API ---------- */

async function handleApi(req, res, url) {
  // 调试钩子：模拟慢接口与故障
  const delay = Math.min(Math.max(Number(url.searchParams.get('delay')) || 0, 0), 8000);
  if (delay) await new Promise((r) => setTimeout(r, delay));
  if (url.searchParams.get('fail') === '1') return sendJson(res, 503, { error: 'simulated_failure' });

  const parts = url.pathname.split('/').filter(Boolean); // ['api', ...]

  if (parts[1] === 'health') {
    return sendJson(res, 200, { ok: true, now: Date.now() });
  }

  if (parts[1] === 'words' && parts.length === 2 && req.method === 'GET') {
    return sendJson(res, 200, { words: WORDS.map(publicWord) });
  }

  if (parts[1] === 'words' && parts.length === 4 && parts[3] === 'echoes' && req.method === 'GET') {
    const word = WORDS.find((w) => w.id === parts[2]);
    if (!word) return sendJson(res, 404, { error: 'word_not_found' });
    return sendJson(res, 200, { id: word.id, echoes: echoesFor(word) });
  }

  if (parts[1] === 'portraits' && parts.length === 3 && req.method === 'GET') {
    const id = parts[2].replace(/\.svg$/, '');
    const person = PHILOSOPHERS[id];
    if (!person) return sendJson(res, 404, { error: 'portrait_not_found' });
    res.writeHead(200, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    });
    return res.end(portraitSvg(person));
  }

  if (parts[1] === 'cabinet' && parts.length === 2) {
    const uid = String(req.headers['x-echo-uid'] || '').slice(0, 64) || 'anon';

    if (req.method === 'GET') {
      const store = loadStore();
      const entry = store[uid];
      return sendJson(res, 200, {
        items: Array.isArray(entry?.items) ? entry.items : [],
        updatedAt: entry?.updatedAt || null,
      });
    }

    if (req.method === 'PUT') {
      let body;
      try { body = await readBody(req); } catch { return sendJson(res, 400, { error: 'bad_request' }); }
      const valid = new Set(WORDS.map((w) => w.id));
      const items = Array.isArray(body.items)
        ? [...new Set(body.items.filter((id) => typeof id === 'string' && valid.has(id)))].slice(0, 64)
        : [];
      const store = loadStore();
      store[uid] = { items, updatedAt: new Date().toISOString() };
      const persisted = saveStore(store);
      return sendJson(res, 200, { ok: true, persisted, items });
    }

    return sendJson(res, 405, { error: 'method_not_allowed' });
  }

  return sendJson(res, 404, { error: 'not_found' });
}

/* ---------- 静态资源（构建后的前端） ---------- */

function serveStatic(req, res, url) {
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end('bad request');
  }
  if (pathname === '/') pathname = '/index.html';

  let abs = path.normalize(path.join(CLIENT_DIST, pathname));
  if (!abs.startsWith(CLIENT_DIST)) {
    res.writeHead(403);
    return res.end('forbidden');
  }

  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) {
      abs = path.join(CLIENT_DIST, 'index.html'); // SPA 回退
      if (!fs.existsSync(abs)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end('<h1>回声标本柜</h1><p>前端尚未构建 —— 请先运行 <code>npm run build</code>。</p>');
      }
    }
    const ext = path.extname(abs).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
    });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs).pipe(res);
  });
}

/* ---------- 启动 ---------- */

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, 'http://localhost');
  } catch {
    res.writeHead(400);
    return res.end('bad request');
  }
  if (url.pathname.startsWith('/api/')) {
    handleApi(req, res, url).catch(() => {
      try { sendJson(res, 500, { error: 'server_error' }); } catch { /* socket gone */ }
    });
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res, url);
  } else {
    res.writeHead(405);
    res.end();
  }
});

server.listen(PORT, () => {
  console.log(`回声标本柜 · echo cabinet`);
  console.log(`→ http://localhost:${PORT}`);
});
