import { useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { MotionContext } from '../motion';
import Portrait from './Portrait';
import Timeline from './Timeline';

/** 已取回的回声按词缓存：反复拾起同一个词不必重新等待接口。 */
const echoCache = new Map();

/**
 * 回声场：拾起一个词后，在其周围浮现的引文、肖像切片与年代线。
 *
 * 边界处理：
 * - 接口慢于动画 → 先渲染骨架占位，数据到达后替换；
 * - 快速连续拾起/放回 → 卸载时 abort 请求，过期响应直接丢弃；
 * - 接口失败 → 呈现"回声未能抵达"并可重试；
 * - 没有关联人物 → 呈现空态与一条"待续"的细线。
 */
export default function EchoField({ word, active, isMobile, regionId }) {
  const { reduced } = useContext(MotionContext);
  const [entered, setEntered] = useState(false);
  const [retryTick, setRetryTick] = useState(0);
  const [state, setState] = useState(() => echoCache.get(word.id) || { status: 'loading' });

  // 入场：两帧后再加 is-in，保证初始样式先绘制，过渡才生效
  useEffect(() => {
    if (reduced) {
      setEntered(true);
      return undefined;
    }
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  useEffect(() => {
    const cached = echoCache.get(word.id);
    if (cached && cached.status === 'ready') {
      setState(cached);
      return undefined;
    }
    const ctrl = new AbortController();
    setState({ status: 'loading' });
    api
      .echoes(word.id, ctrl.signal)
      .then((data) => {
        const next = { status: 'ready', echoes: Array.isArray(data.echoes) ? data.echoes : [] };
        echoCache.set(word.id, next);
        if (!ctrl.signal.aborted) setState(next);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setState({ status: 'error' });
      });
    return () => ctrl.abort();
  }, [word.id, retryTick]);

  const { layout } = word;
  /** 绝对锚点 → 相对词位置的偏移（移动端返回 undefined，退回文档流） */
  const anchor = (pt) =>
    isMobile || !pt ? undefined : { left: `${pt.x - word.pos.x}vw`, top: `${pt.y - word.pos.y}vh` };
  /** 年代线需要显式宽度，否则绝对定位下宽度塌缩为 0 */
  const timelineStyle =
    isMobile || !layout.timeline
      ? undefined
      : {
          left: `${layout.timeline.x - word.pos.x}vw`,
          top: `${layout.timeline.y - word.pos.y}vh`,
          width: `${layout.timeline.w}vw`,
        };

  const cls = `echo-field${entered && active ? ' is-in' : ''}`;

  return (
    <div
      id={regionId}
      className={cls}
      role="region"
      aria-live="polite"
      aria-label={`「${word.word}」的回声`}
    >
      {state.status === 'loading' && (
        <>
          {(layout.quotes.length ? layout.quotes : [layout.empty]).map((pt, i) => (
            <div key={i} className="echo echo-skeleton" style={anchor(pt)} aria-hidden="true">
              <span className="sk sk-portrait" />
              <span className="sk sk-line w60" />
              <span className="sk sk-line w90" />
              <span className="sk sk-line w45" />
            </div>
          ))}
          <div className="timeline timeline-skeleton" style={timelineStyle} aria-hidden="true">
            <span className="timeline-line" />
          </div>
        </>
      )}

      {state.status === 'error' && (
        <div className="echo echo-error" style={anchor(layout.empty || layout.quotes[0])}>
          <p>回声未能抵达。</p>
          <button type="button" className="retry" onClick={() => setRetryTick((t) => t + 1)}>
            再次聆听
          </button>
        </div>
      )}

      {state.status === 'ready' && state.echoes.length === 0 && (
        <>
          <div className="echo echo-empty" style={anchor(layout.empty)}>
            <p className="empty-title">此词尚未引来回声。</p>
            <p className="empty-sub">它仍在等待第一位读者。</p>
          </div>
          <div className="timeline timeline-stub" style={timelineStyle} aria-hidden="true">
            <span className="timeline-line" />
            <span className="timeline-tag up" style={{ left: '50%' }}>
              —— 待 续 ——
            </span>
          </div>
        </>
      )}

      {state.status === 'ready' &&
        state.echoes.map((e, i) => (
          <figure
            key={e.philosopher.id}
            className="echo"
            style={{
              ...anchor(layout.quotes[i] || layout.quotes[layout.quotes.length - 1]),
              transitionDelay: `${i * 150}ms`,
            }}
          >
            <figcaption className="echo-meta">
              <Portrait pid={e.philosopher.id} name={e.philosopher.name} />
              <span className="echo-who">
                <span className="echo-name">{e.philosopher.name}</span>
                <span className="echo-years">{e.philosopher.years}</span>
              </span>
            </figcaption>
            <blockquote className="echo-quote">{e.quote}</blockquote>
            <p className="echo-source">{e.source}</p>
          </figure>
        ))}

      {state.status === 'ready' && state.echoes.length > 0 && (
        <Timeline echoes={state.echoes} anchorStyle={timelineStyle} />
      )}
    </div>
  );
}
