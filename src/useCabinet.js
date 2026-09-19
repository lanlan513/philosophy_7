import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { storage } from './storage';

const LOCAL_KEY = 'echo-cabinet';

function readLocal() {
  try {
    const v = JSON.parse(storage.get(LOCAL_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * 小柜子：用户的收藏。
 * - 立即更新 UI，本地（localStorage/内存）与服务器双写；
 * - 刷新后：先展示本地缓存，再与服务器合并（并集，本地操作优先）；
 * - 服务器不可达时保持离线可用，同步状态对外暴露。
 */
export function useCabinet(notify) {
  const [items, setItems] = useState(readLocal);
  const [sync, setSync] = useState('idle'); // idle | loading | saving | saved | error | offline
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const dirtyRef = useRef(false); // 本地有未与服务器对齐的修改

  useEffect(() => {
    if (!storage.ok) {
      notify('local-off', '本地存储不可写：收藏将依赖服务器保存。');
    }
    let alive = true;
    setSync('loading');
    api
      .getCabinet()
      .then((d) => {
        if (!alive) return;
        const remote = Array.isArray(d.items) ? d.items.filter((x) => typeof x === 'string') : [];
        if (!dirtyRef.current && remote.length) {
          setItems((cur) => {
            const merged = [...new Set([...cur, ...remote])];
            itemsRef.current = merged;
            storage.set(LOCAL_KEY, JSON.stringify(merged));
            return merged;
          });
        }
        setSync('idle');
      })
      .catch(() => {
        if (alive) setSync('offline');
      });
    return () => {
      alive = false;
    };
  }, [notify]);

  const persist = useCallback(
    (next) => {
      storage.set(LOCAL_KEY, JSON.stringify(next));
      setSync('saving');
      api
        .putCabinet(next)
        .then(() => setSync('saved'))
        .catch(() => {
          setSync('error');
          notify('sync-failed', '收藏未能同步到服务器，已保留在本地。');
        });
    },
    [notify],
  );

  const toggle = useCallback(
    (id) => {
      const cur = itemsRef.current;
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      dirtyRef.current = true;
      itemsRef.current = next;
      setItems(next);
      persist(next);
    },
    [persist],
  );

  return { items, sync, toggle };
}
