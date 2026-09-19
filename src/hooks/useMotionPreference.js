// 动效偏好：系统减弱动效 / 低性能设备自动降级 / 手动开关，三者取最保守。
import { useEffect, useState } from 'react';
import { usePersistentState } from './usePersistentState.js';

export function useMotionPreference() {
  const [override, setOverride] = usePersistentState('archive-motion', 'auto');
  const [systemReduced, setSystemReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    if (typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setSystemReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const weakDevice = (() => {
    try {
      const cores = navigator.hardwareConcurrency ?? 8;
      const mem = navigator.deviceMemory ?? 8;
      const saveData = navigator.connection?.saveData === true;
      return saveData || cores <= 2 || mem <= 2;
    } catch {
      return false;
    }
  })();

  const motionOK =
    override === 'on' ? !systemReduced : override === 'off' ? false : !systemReduced && !weakDevice;

  const reason = !motionOK
    ? override === 'off'
      ? '动效已手动关闭'
      : systemReduced
        ? '系统要求减弱动效'
        : '低性能设备，动效已自动关闭'
    : null;

  return { motionOK, reason, override, setOverride };
}
