import { useState } from 'react';

/**
 * 肖像切片：服务端生成的 SVG。
 * - 加载中显示微光扫过的玻片；
 * - 加载失败（404/网络断开）降级为暗红封印 + 姓氏首字。
 */
export default function Portrait({ pid, name }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  return (
    <span className={`portrait portrait-${status}`} aria-hidden="true">
      {status !== 'error' && (
        <img
          src={`/api/portraits/${encodeURIComponent(pid)}.svg`}
          alt=""
          draggable="false"
          onLoad={() => setStatus('ready')}
          onError={() => setStatus('error')}
        />
      )}
      {status === 'error' && <span className="portrait-fallback">{name.slice(0, 1)}</span>}
    </span>
  );
}
