// 轻量 API 客户端：所有请求带超时，失败时抛出带标记的错误，由调用方降级。
const TIMEOUT = 9000;

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeout ?? TIMEOUT);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  words: () => fetchJSON('/api/words'),
  echoes: (id) => fetchJSON(`/api/words/${encodeURIComponent(id)}/echoes`),
  cabinet: (uid) => fetchJSON(`/api/cabinet?uid=${encodeURIComponent(uid)}`),
  saveCabinet: (uid, items) =>
    fetchJSON('/api/cabinet', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, items }),
    }),
};
