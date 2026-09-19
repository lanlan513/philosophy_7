// localStorage 可能不可写（隐私模式 / 配额满）：全部 try/catch，退回内存态。
import { useCallback, useEffect, useState } from 'react';

const memoryStore = new Map();

export function safeStorage() {
  try {
    const probe = '__archive_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

export function usePersistentState(key, initial) {
  const [storageOK] = useState(() => safeStorage() !== null);
  const [value, setValue] = useState(() => {
    try {
      const raw = safeStorage()?.getItem(key) ?? memoryStore.get(key);
      const fallback = typeof initial === 'function' ? initial() : initial;
      return raw != null ? JSON.parse(raw) : fallback;
    } catch {
      return typeof initial === 'function' ? initial() : initial;
    }
  });

  // 首次生成的初始值（如访客 uid）也要落盘，否则刷新后会重新生成
  useEffect(() => {
    try {
      const storage = safeStorage();
      if (storage && storage.getItem(key) == null) storage.setItem(key, JSON.stringify(value));
    } catch { /* 存储不可写：仅保留在内存里 */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      try {
        safeStorage()?.setItem(key, JSON.stringify(resolved));
      } catch { /* 存储不可写：仅保留在内存里 */ }
      memoryStore.set(key, JSON.stringify(resolved));
      return resolved;
    });
  }, [key]);

  return [value, set, storageOK];
}
