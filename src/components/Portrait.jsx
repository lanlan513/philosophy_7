import { useState } from 'react';

// 肖像切片：加载失败时退回排版式占位（首字母 + 拉丁名），不留下破图。
export default function Portrait({ person, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed || !person.portrait) {
    return (
      <div className={`portrait portrait-fallback ${className}`} aria-hidden="true">
        <span className="portrait-initial">{person.latin?.[0] ?? person.name?.[0]}</span>
        <span className="portrait-latin">{person.latin}</span>
      </div>
    );
  }
  return (
    <img
      className={`portrait ${className}`}
      src={person.portrait}
      alt={`${person.name}肖像切片`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
