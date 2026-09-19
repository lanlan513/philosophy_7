// 生成每位哲学家的“肖像切片”SVG：旧标本照片般的抽象切片构图。
// 运行：node scripts/generate-portraits.mjs
import { writeFile, mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const philosophers = JSON.parse(await readFile(join(ROOT, 'server/data/philosophers.json'), 'utf8'));

function hash(str) {
  let h = 2166136261;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

await mkdir(join(ROOT, 'public/portraits'), { recursive: true });

for (const [id, p] of Object.entries(philosophers)) {
  const rnd = hash(id);
  const tint = p.tint;
  const bars = Array.from({ length: 5 }, (_, i) => {
    const w = 14 + rnd() * 46;
    const x = rnd() * 400 - w / 2;
    const o = (0.05 + rnd() * 0.16).toFixed(3);
    return `<rect x="${x.toFixed(1)}" y="0" width="${w.toFixed(1)}" height="520" fill="${tint}" opacity="${o}"/>`;
  }).join('\n  ');
  const cx = (90 + rnd() * 220).toFixed(0);
  const cy = (110 + rnd() * 260).toFixed(0);
  const r = (70 + rnd() * 110).toFixed(0);
  const arcY = (300 + rnd() * 160).toFixed(0);
  const initial = p.latin.replace(/[^A-Za-z]/g, '')[0] || 'P';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="520" viewBox="0 0 400 520">
  <defs>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.14"/></feComponentTransfer><feComposite operator="over" in2="SourceGraphic"/></filter>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#101216"/><stop offset="1" stop-color="#1b1e24"/></linearGradient>
  </defs>
  <rect width="400" height="520" fill="url(#fade)"/>
  ${bars}
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${tint}" stroke-width="1.4" opacity="0.55"/>
  <circle cx="${cx}" cy="${cy}" r="${(r * 0.62).toFixed(0)}" fill="${tint}" opacity="0.10"/>
  <path d="M0 ${arcY} A 400 400 0 0 1 400 ${(arcY - 60 - rnd() * 80).toFixed(0)}" fill="none" stroke="${tint}" stroke-width="1" opacity="0.4"/>
  <text x="200" y="${(cy * 1 + 40).toFixed(0)}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="150" fill="${tint}" opacity="0.8">${initial}</text>
  <text x="24" y="492" font-family="ui-monospace, monospace" font-size="13" letter-spacing="3" fill="${tint}" opacity="0.75">${p.latin.toUpperCase()}</text>
  <rect width="400" height="520" fill="#000" opacity="0" filter="url(#grain)"/>
</svg>`;
  await writeFile(join(ROOT, 'public/portraits', `${id}.svg`), svg);
  console.log('✓', id);
}
