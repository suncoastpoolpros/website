// One-off: subset self-hosted woff2 fonts to the Latin glyphs the site uses.
// Originals are preserved in public/fonts/_orig/. Re-run after replacing a
// font in _orig/. Uses subset-font (harfbuzz WASM) — no system deps.
//
//   node scripts/subset-fonts.mjs
import subsetFont from 'subset-font';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fontsDir = join(root, 'public', 'fonts');
const origDir = join(fontsDir, '_orig');

const FONTS = [
  'inter-400', 'inter-600', 'inter-700',
  'montserrat-400', 'montserrat-700', 'montserrat-900',
  'caveat-700',
];

// Every char the site can render: ASCII + Latin-1 + the typographic marks the
// copy actually uses (curly quotes, en/em dash, bullet, ellipsis, ×, €, ™).
const ascii = Array.from({ length: 0x7f - 0x20 + 1 }, (_, i) => String.fromCodePoint(0x20 + i));
const latin1 = Array.from({ length: 0xff - 0xa0 + 1 }, (_, i) => String.fromCodePoint(0xa0 + i));
const marks = ['‐','‑','‒','–','—','‘','’','‚',
  '“','”','„','•','…','‰','′','″','€','™','×','−'];
const TEXT = [...ascii, ...latin1, ...marks].join('');

const kb = (n) => (n / 1024).toFixed(1);

let totalBefore = 0, totalAfter = 0;
for (const name of FONTS) {
  const src = join(origDir, `${name}.woff2`);
  const dst = join(fontsDir, `${name}.woff2`);
  const input = await readFile(src);
  const out = await subsetFont(input, TEXT, { targetFormat: 'woff2' });
  await writeFile(dst, out);
  const before = (await stat(src)).size;
  const after = out.length;
  totalBefore += before; totalAfter += after;
  const pct = ((1 - after / before) * 100).toFixed(0);
  console.log(`${name.padEnd(16)} ${kb(before).padStart(6)}KB -> ${kb(after).padStart(6)}KB  (-${pct}%)`);
}
console.log('—'.repeat(40));
console.log(`TOTAL            ${kb(totalBefore).padStart(6)}KB -> ${kb(totalAfter).padStart(6)}KB  (-${((1 - totalAfter / totalBefore) * 100).toFixed(0)}%)`);
