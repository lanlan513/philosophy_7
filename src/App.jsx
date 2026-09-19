import { useCallback, useEffect, useRef, useState } from 'react';
import { Archive, Moon, Zap } from 'lucide-react';
import { api } from './api.js';
import { useFontStatus, useMediaQuery, useMotionPreference, usePersistentState } from './hooks/index.js';
import Specimen from './components/Specimen.jsx';
import EchoField from './components/EchoField.jsx';
import Cabinet from './components/Cabinet.jsx';
import SequentialView from './components/SequentialView.jsx';

const ANNOUNCE = {
  pick: (w) => `已拾起「${w}」，回响正在浮现`,
  drop: (w) => `已放下「${w}」`,
  collect: (w) => `「${w}」已收入小柜子`,
  remove: (w) => `「${w}」已取出`,
};

export default function App() {
  const isMobile = useMediaQuery('(max-width: 760px)');
  const { motionOK, reason, setOverride } = useMotionPreference();
  const fontsFellBack = useFontStatus();

  // —— 标本目录 ——
  const [words, setWords] = useState([]);
  const [wordsError, setWordsError] = useState(false);
  useEffect(() => {
    let alive = true;
    api.words()
      .then((d) => alive && setWords(d.words))
      .catch(() => alive && setWordsError(true));
    return () => { alive = false; };
  }, []);

  // —— 拾起状态 + 回响加载（缓存 + 竞态守卫，处理连续点击同一词语） ——
  const [activeId, setActiveId] = useState(null);
  const [echoState, setEchoState] = useState({ status: 'idle', data: null });
  const [echoesCache, setEchoesCache] = useState({});
  const requestSeq = useRef(0);

  const loadEchoes = useCallback((id) => {
    const seq = ++requestSeq.current;
    if (echoesCache[id]) {
      setEchoState({ status: 'ready', data: echoesCache[id] });
      return;
    }
    setEchoState({ status: 'loading', data: null });
    api.echoes(id)
      .then((data) => {
        if (requestSeq.current !== seq) return; // 已被更新的请求取代
        setEchoesCache((c) => ({ ...c, [id]: data }));
        setEchoState({ status: 'ready', data });
      })
      .catch((err) => {
        if (requestSeq.current !== seq || err.name === 'AbortError') return;
        setEchoState({ status: 'error', data: null });
      });
  }, [echoesCache]);

  const pick = useCallback((id) => {
    // 同一词语连续点击 = 拾起再放下；请求序号保证慢响应不会覆盖新状态
    const next = activeId === id ? null : id;
    setActiveId(next);
    if (next) loadEchoes(next);
    else {
      requestSeq.current++;
      setEchoState({ status: 'idle', data: null });
    }
  }, [activeId, loadEchoes]);

  // —— 提示条（aria-live） ——
  const [announcement, setAnnouncement] = useState('');
  const announce = (msg) => { setAnnouncement(''); requestAnimationFrame(() => setAnnouncement(msg)); };

  const drop = useCallback(() => {
    setActiveId((prev) => {
      if (prev) announce(ANNOUNCE.drop(words.find((w) => w.id === prev)?.word ?? ''));
      return null;
    });
  }, [words]);

  // Esc 放下标本
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') drop(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drop]);
  useEffect(() => { if (!activeId) setEchoState({ status: 'idle', data: null }); }, [activeId]);

  // —— 收藏：localStorage 立即生效，服务端异步同步；两者都可能失败 ——
  const [uid] = usePersistentState('archive-uid', () =>
    (crypto.randomUUID ? crypto.randomUUID() : `u-${Date.now()}-${Math.random().toString(36).slice(2)}`));
  const [collected, setCollected, storageOK] = usePersistentState('archive-cabinet', []);
  const [syncState, setSyncState] = useState('idle');

  useEffect(() => { // 刷新后：先读本地（已由 usePersistentState 完成），再向档案馆对齐
    let alive = true;
    api.cabinet(uid)
      .then((d) => {
        if (!alive) return;
        if (Array.isArray(d.items) && d.items.length) setCollected((local) => [...new Set([...d.items, ...local])]);
        setSyncState('synced');
      })
      .catch(() => alive && setSyncState('local'));
    return () => { alive = false; };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncTimer = useRef(null);
  useEffect(() => { // 收藏变化 → 防抖写回服务端；失败则标记“仅本机”
    if (syncState === 'idle') return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      setSyncState('syncing');
      api.saveCabinet(uid, collected)
        .then(() => setSyncState('synced'))
        .catch(() => setSyncState('local'));
    }, 400);
    return () => clearTimeout(syncTimer.current);
  }, [collected, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleCollect = useCallback((id) => {
    setCollected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    const word = words.find((w) => w.id === id);
    if (word) announce(collected.includes(id) ? ANNOUNCE.remove(word.word) : ANNOUNCE.collect(word.word));
  }, [words, collected, setCollected]);

  // —— 键盘：方向键在标本间移动焦点 ——
  const specimenRefs = useRef([]);
  const moveFocus = (fromId, dir) => {
    const idx = words.findIndex((w) => w.id === fromId);
    const next = (idx + dir + words.length) % words.length;
    specimenRefs.current[next]?.focus();
  };

  const [cabinetOpen, setCabinetOpen] = useState(false);
  const activeWord = words.find((w) => w.id === activeId);
  const isCollected = activeWord && collected.includes(activeWord.id);

  const sceneClass = [
    'scene',
    motionOK ? '' : 'no-motion',
    fontsFellBack ? 'fonts-fallback' : '',
    activeId ? 'has-active' : '',
  ].join(' ');

  if (wordsError) {
    return (
      <main className="scene scene-error">
        <p>档案馆的门今天没有开。</p>
        <button type="button" className="text-button" onClick={() => location.reload()}>再敲一次门</button>
      </main>
    );
  }

  return (
    <main className={sceneClass}>
      <div className="grain" aria-hidden="true" />
      <div className="sheen" aria-hidden="true" />

      <header className="scene-header">
        <div className="wordmark">
          <span className="wordmark-mark">Φ</span>
          <span><b>思想档案馆</b><small>ECHO SPECIMEN CABINET</small></span>
        </div>
        <div className="scene-actions">
          <button
            type="button"
            className="text-button motion-toggle"
            aria-pressed={!motionOK}
            title={reason ?? '动效已开启'}
            onClick={() => setOverride(motionOK ? 'off' : 'on')}
          >
            {motionOK ? <Zap size={13} /> : <Moon size={13} />}
            {motionOK ? '动效开' : '动效关'}
          </button>
          <button type="button" className="text-button" onClick={() => setCabinetOpen(true)}>
            <Archive size={13} /> 小柜子 · {collected.length}
          </button>
        </div>
      </header>

      <p className="scene-hint" aria-hidden="true">
        {isMobile ? '依序阅读，点开一个词。' : '拾起一个词，听它的回响。Tab 移动，回车拾起，Esc 放下。'}
      </p>

      {isMobile ? (
        <SequentialView
          words={words}
          activeId={activeId}
          echoState={echoState}
          collected={collected}
          onPick={pick}
          onCollect={toggleCollect}
        />
      ) : (
        <div
          className="tabletop"
          onClick={(e) => { if (e.target === e.currentTarget) drop(); }} // 点桌面空白处放下标本
        >
          {words.map((word, i) => (
            <Specimen
              key={word.id}
              word={word}
              active={activeId === word.id}
              dimmed={!!activeId && activeId !== word.id}
              collected={collected.includes(word.id)}
              motionOK={motionOK}
              buttonRef={(el) => (specimenRefs.current[i] = el)}
              onArrow={(dir) => moveFocus(word.id, dir)}
              onPick={() => {
                pick(word.id);
                announce(activeId === word.id ? ANNOUNCE.drop(word.word) : ANNOUNCE.pick(word.word));
              }}
            />
          ))}

          {activeWord && (
            <>
              <EchoField
                status={echoState.status}
                data={echoState.data}
                word={activeWord}
                onRetry={() => loadEchoes(activeWord.id)}
              />
              <button
                type="button"
                className="collect-button"
                style={{ left: '36%', top: '52%' }}
                onClick={() => toggleCollect(activeWord.id)}
              >
                {isCollected ? '从柜中取出' : '收入柜中'}
              </button>
            </>
          )}
        </div>
      )}

      <footer className="status-line" aria-hidden="true">
        <span>{words.length ? `${words.length} 件标本` : '正在清点标本…'}</span>
        <span>{reason ?? (motionOK ? '动效正常' : '')}</span>
        <span>{storageOK ? '' : '本机存储不可写'}</span>
        <span>{fontsFellBack ? '字体已退回系统栈' : ''}</span>
      </footer>

      <div className="sr-only" role="status" aria-live="polite">{announcement}</div>

      <Cabinet
        open={cabinetOpen}
        items={collected}
        words={words}
        echoesCache={echoesCache}
        syncState={syncState}
        storageOK={storageOK}
        onClose={() => setCabinetOpen(false)}
        onRemove={toggleCollect}
      />
    </main>
  );
}
