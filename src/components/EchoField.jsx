import Portrait from './Portrait.jsx';

// 拾起词语后浮现的回声场：三则引文、肖像切片与一条细细的年代线。
// 接口慢于动画时先出现幽灵占位；无关联人物时给出“未著录”空态。
const SLOTS = [
  { left: '57%', top: '12%', rotate: '-1.2deg' },
  { left: '66%', top: '46%', rotate: '0.8deg' },
  { left: '9%',  top: '57%', rotate: '-0.6deg' },
];

function formatYear(born) {
  return born < 0 ? `前 ${Math.abs(born)}` : `${born}`;
}

function Timeline({ echoes }) {
  const years = echoes.map((e) => e.born);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const span = Math.max(max - min, 1);
  const pad = span * 0.08;
  return (
    <div className="timeline" aria-hidden="true">
      <span className="timeline-rule" />
      {echoes.map((e) => {
        const pct = ((e.born - min + pad) / (span + pad * 2)) * 100;
        return (
          <span key={e.id} className="timeline-mark" style={{ left: `${pct}%` }}>
            <i />
            <b>{formatYear(e.born)}</b>
            <em>{e.name}</em>
          </span>
        );
      })}
    </div>
  );
}

export default function EchoField({ status, data, word, onRetry }) {
  if (status === 'loading') {
    return (
      <div className="echo-field" aria-hidden="true">
        {SLOTS.map((slot, i) => (
          <div key={i} className="echo echo-ghost" style={{ left: slot.left, top: slot.top, '--r': slot.rotate }}>
            <span className="ghost-line w60" />
            <span className="ghost-line w90" />
            <span className="ghost-line w40" />
          </div>
        ))}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="echo-field">
        <div className="echo-note" style={{ left: '57%', top: '18%' }}>
          <p>回响暂时失落了——档案馆的接口没有回应。</p>
          <button type="button" className="text-button" onClick={onRetry}>再次倾听</button>
        </div>
      </div>
    );
  }

  if (!data || data.echoes.length === 0) {
    return (
      <div className="echo-field">
        <div className="echo-note" style={{ left: '57%', top: '18%' }}>
          <span className="echo-stamp">未著录 · UNRECORDED</span>
          <p>「{word.word}」还没有哲学家为它留下回响。<br />也许它正在等你。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="echo-field">
      <p className="echo-note echo-note--note" style={{ left: '57%', top: '6%' }}>{data.note}</p>
      {data.echoes.map((echo, i) => {
        const slot = SLOTS[i % SLOTS.length];
        return (
          <figure
            key={echo.id}
            className="echo"
            style={{ left: slot.left, top: slot.top, '--r': slot.rotate, '--d': `${i * 0.35}s` }}
          >
            <Portrait person={echo} />
            <blockquote>“{echo.quote}”</blockquote>
            <figcaption>
              <b>{echo.name}</b>
              <span>{echo.latin} · {echo.years}</span>
            </figcaption>
          </figure>
        );
      })}
      <Timeline echoes={data.echoes} />
    </div>
  );
}
