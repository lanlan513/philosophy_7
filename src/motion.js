import { createContext, useCallback, useMemo, useState } from 'react';
import { storage } from './storage';
import { useMedia } from './useMedia';

export const MotionContext = createContext({
  reduced: true,
  override: null,
  toggle: () => {},
});

/**
 * 动效偏好：
 * - 用户手动开关（持久化到 localStorage）优先；
 * - 否则跟随系统 prefers-reduced-motion；
 * - 或检测到低端设备（核数/内存很低）时默认关闭动效。
 */
export function useMotionPreferenceValue() {
  const systemReduced = useMedia('(prefers-reduced-motion: reduce)');
  const lowPower = useMemo(() => {
    try {
      const cores = navigator.hardwareConcurrency || 8;
      const mem = navigator.deviceMemory || 8;
      return cores <= 2 || mem <= 2;
    } catch {
      return false;
    }
  }, []);

  const [override, setOverride] = useState(() => {
    const v = storage.get('echo-motion');
    return v === 'full' || v === 'reduced' ? v : null;
  });

  const reduced = override ? override === 'reduced' : systemReduced || lowPower;

  const toggle = useCallback(() => {
    setOverride((cur) => {
      const effective = cur ?? (reduced ? 'reduced' : 'full');
      const next = effective === 'reduced' ? 'full' : 'reduced';
      storage.set('echo-motion', next);
      return next;
    });
  }, [reduced]);

  return useMemo(() => ({ reduced, override, toggle }), [reduced, override, toggle]);
}
