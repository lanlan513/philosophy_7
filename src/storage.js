/**
 * localStorage 安全封装：
 * - 不可写（隐私模式 / 配额满 / 被禁用）时不抛错，降级为会话内存；
 * - `ok` 标记供 UI 提示"本地不可写"。
 */
export const storage = (() => {
  let ok = false;
  try {
    const probe = '__echo_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    ok = true;
  } catch {
    ok = false;
  }
  const mem = new Map();
  return {
    ok,
    get(key) {
      try {
        return ok ? window.localStorage.getItem(key) : mem.get(key) ?? null;
      } catch {
        return mem.get(key) ?? null;
      }
    },
    /** 返回是否真正写入了 localStorage（false = 仅写入内存兜底） */
    set(key, value) {
      try {
        if (ok) {
          window.localStorage.setItem(key, value);
          return true;
        }
      } catch {
        /* 配额满等情况：落入内存 */
      }
      mem.set(key, value);
      return false;
    },
    remove(key) {
      try {
        if (ok) window.localStorage.removeItem(key);
      } catch {
        /* ignore */
      }
      mem.delete(key);
    },
  };
})();
