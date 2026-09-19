// 桌面上的一枚词语标本：排版式标签，可键盘拾起/放下。
export default function Specimen({ word, active, dimmed, collected, motionOK, onPick, onArrow, buttonRef }) {
  const style = {
    left: `${word.x}%`,
    top: `${word.y}%`,
    '--r': `${word.rotate}deg`,
    '--s': word.scale,
    // 拾起时移向展台位（视口 36%, 36%），用 vw/vh 差值做 FLIP 式平移
    ...(active ? { '--dx': `${36 - word.x}vw`, '--dy': `${36 - word.y}vh` } : {}),
  };
  return (
    <button
      ref={buttonRef}
      type="button"
      className={[
        'specimen',
        active ? 'is-active' : '',
        dimmed ? 'is-dim' : '',
        collected ? 'is-collected' : '',
        motionOK ? '' : 'no-motion',
      ].join(' ')}
      style={style}
      aria-pressed={active}
      aria-label={`${word.word}，${word.latin}，标本编号 ${word.catalog}${active ? '，已拾起，再按一次放下' : '，按回车拾起'}`}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onArrow(1); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onArrow(-1); }
      }}
    >
      <span className="specimen-tab" aria-hidden="true">{word.catalog}</span>
      <span className="specimen-word">{word.word}</span>
      <span className="specimen-latin" aria-hidden="true">{word.latin}</span>
      {collected && <span className="specimen-seal" aria-hidden="true">已入柜</span>}
    </button>
  );
}
