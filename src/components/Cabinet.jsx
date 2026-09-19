import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

// 小柜子：用户收藏的标本。刷新后从服务端 / localStorage 回到这里。
export default function Cabinet({ open, items, words, echoesCache, syncState, storageOK, onClose, onRemove }) {
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const wordOf = (id) => words.find((w) => w.id === id);

  return (
    <aside
      className={`cabinet ${open ? 'is-open' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-label="我的标本柜"
      aria-hidden={!open}
      inert={!open}
    >
      <header className="cabinet-head">
        <div>
          <span className="kicker">MY CABINET</span>
          <h2>小柜子</h2>
        </div>
        <button ref={closeRef} type="button" className="icon-button" aria-label="关上柜子" onClick={onClose}>
          <X size={17} />
        </button>
      </header>

      <p className="cabinet-sync" role="status">
        {syncState === 'synced' && '已与档案馆同步'}
        {syncState === 'syncing' && '正在同步…'}
        {syncState === 'local' && (storageOK ? '仅保存在本机（接口未响应）' : '本机存储不可写，仅本次浏览有效')}
        {syncState === 'idle' && ' '}
      </p>

      {items.length === 0 ? (
        <p className="cabinet-empty">柜子还空着。<br />回到桌面，拾起一个词，把它收入柜中。</p>
      ) : (
        <ul className="cabinet-list">
          {items.map((id) => {
            const word = wordOf(id);
            const firstEcho = echoesCache[id]?.echoes?.[0];
            if (!word) return null;
            return (
              <li key={id}>
                <div className="cabinet-item-head">
                  <b>{word.word}</b>
                  <span>{word.latin} · {word.catalog}</span>
                </div>
                {firstEcho && <p>“{firstEcho.quote}” — {firstEcho.name}</p>}
                <button type="button" className="text-button" onClick={() => onRemove(id)}>取出</button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
