import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';
import { MotionContext, useMotionPreferenceValue } from './motion';
import { storage } from './storage';
import { useCabinet } from './useCabinet';
import { useMedia } from './useMedia';
import Desk from './components/Desk';
import CabinetDrawer from './components/CabinetDrawer';
import Notices from './components/Notices';

export default function App() {
  const motion = useMotionPreferenceValue();
  const isMobile = useMedia('(max-width: 720px)');

  const [words, setWords] = useState(null); // null = 加载中
  const [wordsError, setWordsError] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [showHint, setShowHint] = useState(() => storage.get('echo-hint-seen') !== '1');

  const cabinetToggleRef = useRef(null);

  /* ---------- 轻提示 ---------- */
  const notify = useCallback((id, text) => {
    setNotices((cur) => (cur.some((n) => n.id === id) ? cur : [...cur, { id, text }]));
    setTimeout(() => setNotices((cur) => cur.filter((n) => n.id !== id)), 6500);
  }, []);

  const cabinet = useCabinet(notify);

  /* ---------- 目录加载（失败可重试） ---------- */
  const loadWords = useCallback(() => {
    setWordsError(false);
    api
      .words()
      .then((d) => setWords(Array.isArray(d.words) ? d.words : []))
      .catch(() => {
        setWordsError(true);
        notify('words-failed', '标本目录未能送达。');
      });
  }, [notify]);
  useEffect(loadWords, [loadWords]);

  /* ---------- 字体探测：Web 字体失败时切换微调样式 ---------- */
  useEffect(() => {
    let alive = true;
    const settle = (ok) => {
      if (alive) document.documentElement.classList.add(ok ? 'font-ok' : 'font-fallback');
    };
    try {
      if (!document.fonts || typeof document.fonts.load !== 'function') {
        settle(false);
        return undefined;
      }
      const timer = setTimeout(() => settle(false), 3500);
      document.fonts
        .load('600 32px "Noto Serif SC"', '自由灵魂')
        .then((faces) => {
          clearTimeout(timer);
          settle(Boolean(faces && faces.length && document.fonts.check('600 32px "Noto Serif SC"', '自')));
        })
        .catch(() => {
          clearTimeout(timer);
          settle(false);
        });
      return () => {
        alive = false;
        clearTimeout(timer);
      };
    } catch {
      settle(false);
      return undefined;
    }
  }, []);

  /* ---------- 拾起 / 放回（幂等：同一词连续点击只是开关） ---------- */
  const toggleSpecimen = useCallback((id) => {
    setActiveId((cur) => (cur === id ? null : id));
    setDrawerOpen(false);
    setShowHint(false);
    storage.set('echo-hint-seen', '1');
  }, []);

  /* ---------- 键盘漫游 ---------- */
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Escape') {
        if (drawerOpen) setDrawerOpen(false);
        else if (activeId) setActiveId(null);
        return;
      }
      if (typing) return;

      if ((e.key === 'c' || e.key === 'C') && activeId && !drawerOpen) {
        cabinet.toggle(activeId);
        return;
      }
      // 方向键在标本之间漫游
      if (
        ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key) &&
        document.activeElement?.classList.contains('specimen')
      ) {
        e.preventDefault();
        const btns = [...document.querySelectorAll('.specimen')];
        const i = btns.indexOf(document.activeElement);
        if (i === -1) return;
        const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
        btns[(i + dir + btns.length) % btns.length]?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, drawerOpen, cabinet]);

  /* ---------- 提示自动隐去 ---------- */
  useEffect(() => {
    if (!showHint) return undefined;
    const t = setTimeout(() => {
      setShowHint(false);
      storage.set('echo-hint-seen', '1');
    }, 16000);
    return () => clearTimeout(t);
  }, [showHint]);

  /* ---------- 从柜子跳回桌面上的词 ---------- */
  const jumpTo = useCallback(
    (id) => {
      setDrawerOpen(false);
      setActiveId(id);
      requestAnimationFrame(() => {
        const el = document.getElementById(`specimen-${id}`);
        if (!el) return;
        el.focus();
        if (isMobile) {
          el.scrollIntoView({ block: 'center', behavior: motion.reduced ? 'auto' : 'smooth' });
        }
      });
    },
    [isMobile, motion.reduced],
  );

  return (
    <MotionContext.Provider value={motion}>
      <div className="app" data-motion={motion.reduced ? 'reduced' : 'full'}>
        <header className="masthead">
          <h1>西方哲学 · 思想档案馆</h1>
          <p className="sub">
            <span className="cat">NO. 013</span> ECHO SPECIMEN CABINET — 回声标本柜
          </p>
        </header>

        <button
          type="button"
          ref={cabinetToggleRef}
          className="cabinet-toggle"
          aria-expanded={drawerOpen}
          aria-controls="cabinet-drawer"
          onClick={() => setDrawerOpen((o) => !o)}
        >
          柜 · <span className="n">{cabinet.items.length}</span>
        </button>

        <Desk
          words={words}
          wordsError={wordsError}
          activeId={activeId}
          cabinetItems={cabinet.items}
          isMobile={isMobile}
          onToggle={toggleSpecimen}
          onCollect={cabinet.toggle}
          onRetry={loadWords}
        />

        {showHint && !activeId && (
          <p className="hint">点按词语将其拾起 · Tab 移动，Enter 拾起，C 收入柜中</p>
        )}

        <button
          type="button"
          className="motion-toggle"
          aria-pressed={motion.reduced}
          onClick={motion.toggle}
          title="切换动效"
        >
          动效 {motion.reduced ? '关' : '开'}
        </button>

        <CabinetDrawer
          open={drawerOpen}
          items={cabinet.items}
          words={words}
          sync={cabinet.sync}
          onClose={() => setDrawerOpen(false)}
          onToggleItem={cabinet.toggle}
          onJump={jumpTo}
          toggleRef={cabinetToggleRef}
        />

        <Notices notices={notices} />
      </div>
    </MotionContext.Provider>
  );
}
