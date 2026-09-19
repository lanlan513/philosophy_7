import { useEffect, useMemo, useRef } from 'react';

const SYNC_TEXT = {
  idle: '',
  loading: '连接中 …',
  saving: '同步中 …',
  saved: '已同步',
  error: '同步失败',
  offline: '离线 · 仅本地',
};

/**
 * 我的柜子：收藏的词在此归位。
 * 打开时焦点进入，关闭时焦点交还给触发按钮；Esc 关闭。
 */
export default function CabinetDrawer({ open, items, words, sync, onClose, onToggleItem, onJump, toggleRef }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    } else if (document.activeElement?.closest('.cabinet')) {
      toggleRef?.current?.focus();
    }
  }, [open, toggleRef]);

  const wordById = useMemo(() => new Map((words || []).map((w) => [w.id, w])), [words]);
  const known = items.filter((id) => wordById.has(id));

  return (
    <aside
      id="cabinet-drawer"
      className={`cabinet${open ? ' open' : ''}`}
      role="dialog"
      aria-label="我的标本柜"
      aria-hidden={!open}
    >
      <header className="cabinet-head">
        <h2>
          我的柜子 <span className="count">{items.length}</span>
        </h2>
        <span className={`sync sync-${sync}`}>{SYNC_TEXT[sync] || ''}</span>
        <button type="button" ref={closeRef} className="cabinet-close" onClick={onClose} aria-label="关闭柜子">
          ×
        </button>
      </header>

      {items.length === 0 ? (
        <p className="cabinet-empty">
          柜子还是空的。
          <br />
          拾起一个词，按 <kbd>C</kbd> 收入。
        </p>
      ) : (
        <ul className="cabinet-list">
          {items.map((id) => {
            const w = wordById.get(id);
            if (!w) return null;
            return (
              <li key={id}>
                <button type="button" className="cabinet-word" onClick={() => onJump(id)}>
                  <span className="w">{w.word}</span>
                  <span className="meta">
                    {w.no} · {w.latin}
                  </span>
                </button>
                <button
                  type="button"
                  className="cabinet-remove"
                  onClick={() => onToggleItem(id)}
                  aria-label={`把「${w.word}」移出柜子`}
                >
                  移出
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {items.length > 0 && known.length === 0 && (
        <p className="cabinet-empty">目录尚未送达，藏品稍后显现。</p>
      )}
    </aside>
  );
}
