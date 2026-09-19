// 字体加载状态：成功 / 回退到系统字体栈 / 仍在等待（静默，不阻塞渲染）
import { useEffect, useState } from 'react';

export function useFontStatus() {
  const [fellBack, setFellBack] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timeout = new Promise((_, reject) => setTimeout(reject, 4000));
    Promise.race([document.fonts?.ready ?? Promise.resolve(), timeout])
      .then(() => {
        if (cancelled) return;
        const ok =
          document.fonts.check('16px "Instrument Serif"') ||
          document.fonts.check('16px "Noto Serif SC"');
        setFellBack(!ok);
      })
      .catch(() => {
        if (!cancelled) setFellBack(true);
      });
    return () => { cancelled = true; };
  }, []);

  return fellBack;
}
