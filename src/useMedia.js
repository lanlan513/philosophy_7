import { useEffect, useState } from 'react';

/** 响应式媒体查询 Hook（用于移动端降级、系统减弱动效等）。 */
export function useMedia(query) {
  const [matches, setMatches] = useState(() => {
    try {
      return window.matchMedia(query).matches;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    let mql;
    try {
      mql = window.matchMedia(query);
    } catch {
      return undefined;
    }
    const onChange = () => setMatches(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);
  return matches;
}
