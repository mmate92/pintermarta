// Generates the theatre curtains in src/assets/hatter/:
//   fuggony-oldal.svg  – the left side curtain (mirrored in CSS for the right side)
//   fuggony-felso.svg  – one swag of the top drape (repeated horizontally in CSS)
// Run:  node draft_backgrounds/curtains_v2/make-curtains.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./', import.meta.url);
mkdirSync(OUT, { recursive: true });

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n) => Number(n.toFixed(1));

// velvet colour for a brightness between 0 (deep in a fold) and 1 (top of a ridge)
const SHADES = [[28, 3, 8], [74, 10, 20], [128, 22, 36], [176, 40, 52], [214, 86, 92]];
function velvet(l) {
  const p = Math.min(0.9999, Math.max(0, l)) * (SHADES.length - 1), i = Math.floor(p), k = p - i;
  const c = SHADES[i].map((v, j) => Math.round(v + (SHADES[i + 1][j] - v) * k));
  return `rgb(${c.join(',')})`;
}
const GOLD_DEFS =
  `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e3a1"/><stop offset=".45" stop-color="#cfa434"/><stop offset="1" stop-color="#7d5f17"/></linearGradient>` +
  `<linearGradient id="goldH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7d5f17"/><stop offset=".35" stop-color="#f6e3a1"/><stop offset=".7" stop-color="#cfa434"/><stop offset="1" stop-color="#6b5013"/></linearGradient>`;

/* ------------------------------------------------------------------
   Side curtain: heavy velvet gathered by a rope tie-back
   ------------------------------------------------------------------ */
function sideCurtain() {
  const W = 300, H = 1000, TY = 600, GATHER = 0.4, FOOT = 0.63, r = rng(5);
  // how wide the fabric hangs at height y (1 = full width at the rail)
  const widthAt = (y) => {
    if (y <= TY) return 1 - (1 - GATHER) * Math.pow(y / TY, 2.3);
    return GATHER + (FOOT - GATHER) * (1 - Math.pow(1 - (y - TY) / (H - TY), 2.4));
  };
  const X = (t, y) => W * widthAt(y) * t;
  const ys = [];
  for (let y = 0; y <= H; y += 20) ys.push(y);

  // folds of uneven width; each is shaded like a rounded pleat
  const FOLDS = 8, SUB = 14;
  const widths = Array.from({ length: FOLDS }, () => 0.6 + r() * 1.0);
  const total = widths.reduce((a, b) => a + b, 0);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs>${GOLD_DEFS}`;
  s += `<linearGradient id="hang" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".62"/><stop offset=".1" stop-color="#000" stop-opacity=".2"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>`;
  s += `<linearGradient id="wall" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".3" stop-color="#000" stop-opacity="0"/></linearGradient>`;
  s += `<radialGradient id="pinch" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".6"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`;
  s += `<filter id="pile" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.5 0.006" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.1 -0.42"/></filter>`;
  const edge = ys.map((y) => `${f(X(1, y))},${y}`).join(' ');
  s += `<clipPath id="cloth"><polygon points="0,0 ${edge} 0,${H}"/></clipPath></defs>`;

  let t0 = 0;
  for (let i = 0; i < FOLDS; i++) {
    const fw = widths[i] / total, depth = 0.38 + r() * 0.1, lift = 0.47 + r() * 0.08, phase = 0.28 + r() * 0.14;
    for (let j = 0; j < SUB; j++) {
      const ta = t0 + (fw * j) / SUB, tb = t0 + (fw * (j + 1)) / SUB;
      const l = lift + depth * Math.cos(2 * Math.PI * ((j + 0.5) / SUB - phase));
      const c = velvet(l);
      const down = ys.map((y) => `${f(X(ta, y))},${y}`), up = ys.map((y) => `${f(X(tb, y) + 0.4)},${y}`).reverse();
      s += `<polygon points="${down.join(' ')} ${up.join(' ')}" fill="${c}"/>`;
    }
    t0 += fw;
  }
  s += `<g clip-path="url(#cloth)">`;
  s += `<rect width="${W}" height="${H}" filter="url(#pile)" opacity=".22"/>`;
  s += `<rect width="${W}" height="${H}" fill="url(#hang)"/><rect width="${W}" height="${H}" fill="url(#wall)"/>`;
  const gw = W * GATHER;
  s += `<ellipse cx="${f(gw * 0.5)}" cy="${TY + 46}" rx="${f(gw * 0.85)}" ry="62" fill="url(#pinch)"/>`;
  s += `<ellipse cx="${f(gw * 0.5)}" cy="${TY - 52}" rx="${f(gw * 0.8)}" ry="34" fill="url(#pinch)" opacity=".55"/>`;
  s += `</g>`;

  // gold braid and fringe along the leading edge
  const lead = 'M' + ys.map((y) => `${f(X(1, y) - 3)},${y}`).join(' L');
  s += `<path d="${lead}" fill="none" stroke="#3b2a08" stroke-width="9" opacity=".5"/>`;
  s += `<path d="${lead}" fill="none" stroke="url(#goldH)" stroke-width="6.5"/>`;
  s += `<path d="${lead}" fill="none" stroke="#e9cf7e" stroke-width="3.5" stroke-dasharray="1 1.4" transform="translate(4,0)" opacity=".85"/>`;

  // rope tie-back with a tassel
  const x1 = gw + 10, band = `M-4,${TY - 40} Q${f(x1 * 0.5)},${TY - 6} ${f(x1)},${TY - 20} L${f(x1 + 2)},${TY + 6} Q${f(x1 * 0.5)},${TY + 24} -4,${TY - 10} Z`;
  s += `<path d="${band}" transform="translate(0,7)" fill="#000" opacity=".4"/>`;
  s += `<clipPath id="rope"><path d="${band}"/></clipPath><path d="${band}" fill="url(#gold)"/>`;
  s += `<g clip-path="url(#rope)" stroke="#6b5013" stroke-width="2.2" opacity=".65">`;
  for (let x = -30; x < x1 + 30; x += 8) s += `<line x1="${x}" y1="${TY - 50}" x2="${x + 22}" y2="${TY + 34}"/>`;
  s += `</g><path d="${band}" fill="none" stroke="#5a430f" stroke-width="1"/>`;
  const tx = f(gw * 0.74), ty = TY + 12;
  s += `<path d="M${tx},${ty} q3,26 0,44" fill="none" stroke="url(#goldH)" stroke-width="4"/>`;
  s += `<ellipse cx="${tx}" cy="${ty + 52}" rx="10" ry="12" fill="url(#goldH)" stroke="#5a430f" stroke-width=".8"/>`;
  s += `<rect x="${tx - 9}" y="${ty + 61}" width="18" height="7" rx="2" fill="#8a6a1c"/>`;
  s += `<path d="M${tx - 9},${ty + 67} L${tx - 15},${ty + 132} L${tx + 15},${ty + 132} L${tx + 9},${ty + 67} Z" fill="url(#goldH)"/>`;
  for (let k = -4; k <= 4; k++) s += `<line x1="${f(tx + k * 2)}" y1="${ty + 69}" x2="${f(tx + k * 3.3)}" y2="${ty + 132}" stroke="#6b5013" stroke-width=".9" opacity=".7"/>`;
  return s + '</svg>';
}

/* ------------------------------------------------------------------
   Top drape: one swag with pleated tails at both ends
   ------------------------------------------------------------------ */
function valance() {
  const W = 320, H = 170, BANDS = 7;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${GOLD_DEFS}`;
  s += `<linearGradient id="fold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${velvet(0.42)}"/><stop offset=".3" stop-color="${velvet(0.86)}"/><stop offset=".62" stop-color="${velvet(0.5)}"/><stop offset="1" stop-color="${velvet(0.06)}"/></linearGradient>`;
  s += `<linearGradient id="ends" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".22" stop-color="#000" stop-opacity="0"/><stop offset=".78" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`;
  s += `<linearGradient id="rail" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".7"/><stop offset=".3" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
  // each fold of the swag hangs a little lower than the one above it
  const arc = (k) => {
    const end = 6 + k * 8.5, sag = end + 22 + k * 15;
    return { end, d: `Q${W / 2},${f(sag * 2 - end)} `, mid: sag };
  };
  let last = `M0,0 H${W}`;
  for (let k = 0; k < BANDS; k++) {
    const a = arc(k), prev = k ? arc(k - 1) : null;
    const top = prev ? `M0,${prev.end} ${prev.d}${W},${prev.end}` : `M0,0 L${W},0`;
    s += `<path d="${top} L${W},${a.end} Q${W / 2},${f(a.mid * 2 - a.end)} 0,${a.end} Z" fill="url(#fold)"/>`;
    last = `M0,${a.end} ${a.d}${W},${a.end}`;
  }
  const hem = arc(BANDS - 1);
  s += `<path d="M0,0 H${W} V${hem.end} Q${W / 2},${f(hem.mid * 2 - hem.end)} 0,${hem.end} Z" fill="url(#ends)"/>`;
  s += `<path d="${last}" fill="none" stroke="url(#gold)" stroke-width="5"/>`;
  s += `<path d="${last}" fill="none" stroke="#e9cf7e" stroke-width="11" stroke-dasharray="1.8 2.6" transform="translate(0,8)"/>`;
  // pleated tails where two swags meet (half of each is drawn on either tile edge)
  const tail = [84, 116, 146, 146, 116, 84], pw = 13;
  for (const cx of [0, W]) {
    tail.forEach((h, i) => {
      const x = cx + (i - tail.length / 2) * pw;
      s += `<rect x="${f(x)}" y="0" width="${pw + 0.3}" height="${h}" fill="${velvet(i % 2 ? 0.2 : 0.66)}"/>`;
      s += `<rect x="${f(x)}" y="0" width="${pw + 0.3}" height="${h}" fill="url(#rail)"/>`;
      s += `<rect x="${f(x)}" y="${h - 3}" width="${pw + 0.3}" height="4" fill="url(#gold)"/>`;
      for (let q = 0; q < 5; q++) s += `<line x1="${f(x + 1.6 + q * 2.5)}" y1="${h + 1}" x2="${f(x + 1.6 + q * 2.5)}" y2="${h + 10}" stroke="#e9cf7e" stroke-width="1.3"/>`;
    });
    s += `<circle cx="${cx}" cy="17" r="13" fill="url(#gold)" stroke="#5a430f" stroke-width="1"/><circle cx="${cx}" cy="17" r="6" fill="#7d5f17"/>`;
  }
  s += `<rect width="${W}" height="${H}" fill="url(#rail)" opacity=".5"/>`;
  return s + '</svg>';
}

writeFileSync(new URL('fuggony-oldal.svg', OUT), sideCurtain());
writeFileSync(new URL('fuggony-felso.svg', OUT), valance());
console.log('curtains written to src/assets/hatter/');
