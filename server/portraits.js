'use strict';

/**
 * 肖像切片生成器：为每位哲学家生成确定性的抽象 SVG"切片标本"。
 * 不依赖任何外部图片；同一人物每次生成结果一致。
 */

function hash(str) {
  let h = 2166136261;
  for (const c of String(str)) {
    h ^= c.codePointAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GRAYS = ['#5b6673', '#48525e', '#6d7987', '#39424d', '#7f8b99'];
const RED = '#8a322c';

function portraitSvg(p) {
  const rnd = mulberry(hash(p.id));
  const W = 180;
  const H = 220;

  // 纵向切片：像玻片标本一样错落排列
  let slices = '';
  let x = -12;
  while (x < W + 12) {
    const w = 6 + rnd() * 30;
    const c = GRAYS[(rnd() * GRAYS.length) | 0];
    const o = (0.22 + rnd() * 0.5).toFixed(2);
    const y = ((rnd() - 0.5) * 60).toFixed(1);
    slices += `<rect x="${x.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${H + 120}" fill="${c}" opacity="${o}"/>`;
    x += w + rnd() * 8;
  }

  // 一道玻璃反光
  const bandY = (H * 0.15 + rnd() * H * 0.6).toFixed(1);
  const band = `<rect x="0" y="${bandY}" width="${W}" height="${(1 + rnd() * 2).toFixed(1)}" fill="#e6ebf1" opacity="0.45"/>`;

  // 暗红封印
  const seal = `<circle cx="${(20 + rnd() * (W - 40)).toFixed(1)}" cy="${(24 + rnd() * (H - 48)).toFixed(1)}" r="${(5 + rnd() * 5).toFixed(1)}" fill="${RED}" opacity="0.9"/>`;

  // 巨大的衬线首字母，像标签拓印
  const initial = String(p.latin || p.name).charAt(0).toUpperCase();
  const letter = `<text x="${W / 2}" y="${H / 2 + 36}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-style="italic" font-size="110" fill="#eef2f6" opacity="0.14">${initial}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}">
<defs>
<radialGradient id="vig" cx="50%" cy="42%" r="78%">
<stop offset="55%" stop-color="#000000" stop-opacity="0"/>
<stop offset="100%" stop-color="#000000" stop-opacity="0.45"/>
</radialGradient>
<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
</defs>
<rect width="${W}" height="${H}" fill="#1d232b"/>
${slices}
${band}
${letter}
${seal}
<rect width="${W}" height="${H}" fill="url(#vig)"/>
<rect width="${W}" height="${H}" filter="url(#gr)" opacity="0.07"/>
</svg>`;
}

module.exports = { portraitSvg };
