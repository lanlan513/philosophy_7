function fmtYear(y) {
  return y < 0 ? `前 ${-y}` : `${y}`;
}

const MIN_LABEL_GAP = 13; // 标签之间的最小水平间距（%）

/**
 * 年代线：一条细线 + 三个节点，按出生年等比落位。
 * 节点落在真实年份位置；标签做防碰撞推移，上下交错排布。
 */
export default function Timeline({ echoes, anchorStyle, delayBase = 0 }) {
  if (!echoes.length) return null;
  const years = echoes.map((e) => e.philosopher.born);
  const min = Math.min(...years);
  const max = Math.max(...years);
  const span = Math.max(max - min, 1);

  const nodes = echoes
    .map((e, i) => ({
      key: e.philosopher.id,
      pct: 6 + ((e.philosopher.born - min) / span) * 88,
      label: `${fmtYear(e.philosopher.born)} · ${e.philosopher.name}`,
      up: i % 2 === 0,
      delay: `${delayBase + 500 + i * 160}ms`,
    }))
    .sort((a, b) => a.pct - b.pct);

  // 防碰撞：保证相邻标签的最小间距，整体溢出时向左回收
  let cursor = 2;
  for (const n of nodes) {
    n.labelPct = Math.max(n.pct, cursor);
    cursor = n.labelPct + MIN_LABEL_GAP;
  }
  const overflow = cursor - MIN_LABEL_GAP - 96;
  if (overflow > 0) {
    for (const n of nodes) n.labelPct = Math.max(2, n.labelPct - overflow);
  }

  return (
    <div
      className="timeline"
      style={anchorStyle}
      aria-label={`年代线：从 ${fmtYear(min)} 到 ${fmtYear(max)}`}
      role="img"
    >
      <span className="timeline-line" />
      {nodes.map((n) => (
        <span key={n.key}>
          <span className="timeline-node" style={{ left: `${n.pct}%`, transitionDelay: n.delay }} />
          <span
            className={`timeline-tag${n.up ? ' up' : ''}`}
            style={{ left: `${n.labelPct}%`, transitionDelay: n.delay }}
          >
            {n.label}
          </span>
        </span>
      ))}
    </div>
  );
}
