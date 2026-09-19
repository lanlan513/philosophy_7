import { storage } from './storage';

/** 访客标识：用于服务端区分"谁的小柜子"。localStorage 不可写时仅存活于本次会话。 */
const uid = (() => {
  let id = storage.get('echo-uid');
  if (!id) {
    const rand =
      window.crypto && typeof window.crypto.randomUUID === 'function'
        ? window.crypto.randomUUID()
        : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    id = rand;
    storage.set('echo-uid', id);
  }
  return id;
})();

/**
 * 轻量请求封装：
 * - 支持外部 AbortSignal（组件卸载即取消，防止过期响应覆盖新状态）；
 * - 自带超时兜底，接口再慢也不会永远悬挂。
 */
async function request(path, { method = 'GET', body, signal, timeout = 15000 } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const onOuterAbort = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) ctrl.abort();
    else signal.addEventListener('abort', onOuterAbort, { once: true });
  }
  try {
    const res = await fetch(path, {
      method,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-echo-uid': uid },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onOuterAbort);
  }
}

export const api = {
  words: (signal) => request('/api/words', { signal }),
  echoes: (id, signal) => request(`/api/words/${encodeURIComponent(id)}/echoes`, { signal }),
  getCabinet: (signal) => request('/api/cabinet', { signal }),
  putCabinet: (items, signal) =>
    request('/api/cabinet', { method: 'PUT', body: { items }, signal, timeout: 10000 }),
};
