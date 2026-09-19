import Portrait from './Portrait.jsx';

// 移动端降级：自由散落布局 → 顺序阅读。每个词是可展开的小节。
export default function SequentialView({ words, activeId, echoState, collected, onPick, onCollect }) {
  return (
    <ol className="seq-list">
      {words.map((word, i) => {
        const open = activeId === word.id;
        const state = open ? echoState : null;
        return (
          <li key={word.id} className={open ? 'is-open' : ''}>
            <button
              type="button"
              className="seq-head"
              aria-expanded={open}
              onClick={() => onPick(word.id)}
            >
              <span className="seq-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="seq-word">{word.word}</span>
              <span className="seq-latin">{word.latin}</span>
              {collected.includes(word.id) && <span className="specimen-seal">已入柜</span>}
            </button>

            {open && (
              <div className="seq-body">
                {state?.status === 'loading' && <p className="seq-note">正在倾听回响…</p>}
                {state?.status === 'error' && <p className="seq-note">回响暂时失落了，请再试一次。</p>}
                {state?.status === 'ready' && state.data.echoes.length === 0 && (
                  <p className="seq-note">「{word.word}」还没有被著录，也许它在等你。</p>
                )}
                {state?.status === 'ready' && state.data.echoes.length > 0 && (
                  <>
                    <p className="seq-note">{state.data.note}</p>
                    {state.data.echoes.map((echo) => (
                      <figure key={echo.id} className="seq-echo">
                        <Portrait person={echo} />
                        <blockquote>“{echo.quote}”</blockquote>
                        <figcaption>{echo.name} · {echo.years}</figcaption>
                      </figure>
                    ))}
                  </>
                )}
                <button type="button" className="collect-button" onClick={() => onCollect(word.id)}>
                  {collected.includes(word.id) ? '从柜中取出' : '收入柜中'}
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
