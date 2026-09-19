import { useContext, useEffect, useState } from 'react';
import { MotionContext } from '../motion';
import EchoField from './EchoField';

/**
 * 词语标本：桌面上的一个词。
 * - 本身是 <button>，可 Tab 聚焦、Enter/Space 拾取；
 * - 再次点击（或 Esc）放回；快速连续点击是幂等的状态切换，不会卡死；
 * - 放回时回声场延迟卸载，让退场过渡播完。
 */
export default function Specimen({ word, index, active, collected, isMobile, onToggle, onCollect }) {
  const { reduced } = useContext(MotionContext);
  const [renderEcho, setRenderEcho] = useState(active);

  useEffect(() => {
    if (active) {
      setRenderEcho(true);
      return undefined;
    }
    const t = setTimeout(() => setRenderEcho(false), reduced ? 0 : 500);
    return () => clearTimeout(t);
  }, [active, reduced]);

  const regionId = `echoes-${word.id}`;
  const wrapStyle = isMobile
    ? undefined
    : {
        left: `${word.pos.x}vw`,
        top: `${word.pos.y}vh`,
        '--float-delay': `${index * -1.7}s`,
      };

  return (
    <div className={`specimen-wrap${active ? ' is-active' : ''}`} style={wrapStyle}>
      <button
        type="button"
        id={`specimen-${word.id}`}
        className="specimen"
        style={{ '--rot': `${word.pos.r}deg` }}
        aria-expanded={active}
        aria-controls={regionId}
        aria-label={`${word.word}，${word.hint}${collected ? '，已收藏' : ''}`}
        onClick={() => onToggle(word.id)}
      >
        <span className="specimen-word">{word.word}</span>
        <span className="specimen-label" aria-hidden="true">
          <span className="no">{word.no}</span>
          <span className="latin">{word.latin}</span>
          <span className={`seal${collected ? ' on' : ''}`} />
        </span>
      </button>

      <button
        type="button"
        className={`collect${collected ? ' on' : ''}`}
        tabIndex={active || isMobile ? 0 : -1}
        aria-pressed={collected}
        onClick={() => onCollect(word.id)}
      >
        {collected ? '移出柜子' : '收入柜中'}
        <kbd>C</kbd>
      </button>

      {renderEcho && (
        <EchoField word={word} active={active} isMobile={isMobile} regionId={regionId} />
      )}
    </div>
  );
}
