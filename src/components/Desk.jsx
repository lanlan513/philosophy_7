import { useContext, useEffect, useRef } from 'react';
import { MotionContext } from '../motion';
import Specimen from './Specimen';

/**
 * 深色桌面：所有标本散落其上。
 * - 指针移动时，玻璃反光层缓慢漂移（减弱动效 / 移动端 / 触屏时关闭）；
 * - 点击空白处放回当前词；
 * - 有词被拾起时，其余标本退暗。
 */
export default function Desk({ words, wordsError, activeId, cabinetItems, isMobile, onToggle, onCollect, onRetry }) {
  const { reduced } = useContext(MotionContext);
  const deskRef = useRef(null);

  useEffect(() => {
    if (reduced || isMobile) return undefined;
    const el = deskRef.current;
    if (!el) return undefined;
    let raf = 0;
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        el.style.setProperty('--sheen-x', `${(nx * 18).toFixed(1)}px`);
        el.style.setProperty('--sheen-y', `${(ny * 12).toFixed(1)}px`);
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced, isMobile]);

  const onDeskClick = (e) => {
    if (e.target === e.currentTarget && activeId) onToggle(activeId);
  };

  return (
    <main
      ref={deskRef}
      className={`desk${activeId ? ' has-active' : ''}`}
      aria-label="词语标本桌面"
      onClick={onDeskClick}
    >
      {words === null && !wordsError && <p className="desk-status">正在整理标本 …</p>}

      {wordsError && (
        <div className="desk-status">
          <p>标本目录未能送达。</p>
          <button type="button" className="retry" onClick={onRetry}>
            重新整理
          </button>
        </div>
      )}

      {words &&
        words.map((w, i) => (
          <Specimen
            key={w.id}
            word={w}
            index={i}
            active={activeId === w.id}
            collected={cabinetItems.includes(w.id)}
            isMobile={isMobile}
            onToggle={onToggle}
            onCollect={onCollect}
          />
        ))}
    </main>
  );
}
