// Generates the illustrated backgrounds in src/assets/hatter/.
// Run from the project root:  node tools/make-backgrounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('./generated/', import.meta.url);
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
const SPINES = [
  '#6e1423', '#8a1c2b', '#571019', '#5a2d1a', '#7b3f22', '#4a2414', '#8a6d1f', '#a8842c',
  '#2f3b2a', '#232b3a', '#3a2a22', '#6b4a2b', '#7a2a1e', '#c2b08a', '#3d1c1c', '#5c4a1c',
];
const GOLD = '#d4af5a';
const f = (n) => Number(n.toFixed(1));

/* ---------- 1. Bookshelf: a seamless tile ---------- */
function bookshelf() {
  const W = 1200, ROW = 190, ROWS = 4, BOARD = 16, r = rng(7);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${ROW * ROWS}" viewBox="0 0 ${W} ${ROW * ROWS}">`;
  s += `<defs><linearGradient id="wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3d22"/><stop offset=".5" stop-color="#4a2814"/><stop offset="1" stop-color="#2a150a"/></linearGradient>`;
  s += `<linearGradient id="round" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".42"/></linearGradient>`;
  s += `<linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".75"/><stop offset=".35" stop-color="#000" stop-opacity=".15"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${ROW * ROWS}" fill="#170c07"/>`;
  for (let row = 0; row < ROWS; row++) {
    const floor = (row + 1) * ROW - BOARD;
    let x = 0;
    while (x < W) {
      let w = 16 + Math.floor(r() * 22);
      if (W - x - w < 16) w = W - x;
      const h = 108 + Math.floor(r() * 52), y = floor - h, c = SPINES[Math.floor(r() * SPINES.length)];
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/>`;
      const deco = r();
      if (deco < 0.55) {
        s += `<rect x="${x}" y="${y + 12}" width="${w}" height="2" fill="${GOLD}" opacity=".8"/><rect x="${x}" y="${y + 18}" width="${w}" height="1" fill="${GOLD}" opacity=".6"/>`;
        s += `<rect x="${x}" y="${floor - 20}" width="${w}" height="2" fill="${GOLD}" opacity=".8"/>`;
      }
      if (deco > 0.3 && w > 20) s += `<rect x="${x + 5}" y="${y + 30}" width="${w - 10}" height="${Math.min(34, h / 4)}" fill="${deco > 0.7 ? '#1c0f0a' : GOLD}" opacity="${deco > 0.7 ? 0.55 : 0.35}"/>`;
      s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#round)"/>`;
      x += w;
    }
    s += `<rect x="0" y="${row * ROW}" width="${W}" height="${ROW - BOARD}" fill="url(#shade)"/>`;
    s += `<rect x="0" y="${floor}" width="${W}" height="${BOARD}" fill="url(#wood)"/><rect x="0" y="${floor}" width="${W}" height="1.5" fill="#a9743f" opacity=".7"/>`;
  }
  return s + '</svg>';
}

/* ---------- 2. Library interior in one-point perspective ---------- */
function library() {
  const W = 1600, H = 1000, VX = 800, VY = 455;
  const BX = 610, BT = 300, BB = 630;                 // back wall: left edge, top, bottom
  const HALF = VX - BX;
  // y of the ray that passes the back wall at height fraction fr, taken at screen x
  const yAt = (x, fr) => VY + (Math.abs(VX - x) / HALF) * (BT + fr * (BB - BT) - VY);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">`;
  s += `<defs><radialGradient id="glow" cx="50%" cy="46%" r="50%"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".95"/><stop offset=".25" stop-color="#e9b25a" stop-opacity=".45"/><stop offset="1" stop-color="#2a1208" stop-opacity="0"/></radialGradient>`;
  s += `<linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#f1c477"/></linearGradient>`;
  s += `<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a5a2e"/><stop offset="1" stop-color="#2b150a"/></linearGradient>`;
  s += `<linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d0e08"/><stop offset="1" stop-color="#5a3219"/></linearGradient>`;
  s += `<linearGradient id="depthL" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`;
  s += `<linearGradient id="depthR" x1="1" y1="0" x2="0" y2="0"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="#1a0c07"/>`;

  // ceiling with coffers, floor with planks
  s += `<polygon points="0,${f(yAt(0, 0))} ${BX},${BT} ${W - BX},${BT} ${W},${f(yAt(W, 0))}" fill="url(#ceil)"/>`;
  s += `<polygon points="0,${f(yAt(0, 1))} ${BX},${BB} ${W - BX},${BB} ${W},${f(yAt(W, 1))}" fill="url(#floor)"/>`;
  for (let i = 0; i <= 10; i++) {
    const bx = BX + (i / 10) * (W - 2 * BX), k = 9;     // rays from the back wall edge outwards
    const ex = VX + (bx - VX) * k;
    s += `<line x1="${f(bx)}" y1="${BB}" x2="${f(ex)}" y2="${f(VY + (BB - VY) * k)}" stroke="#2b150a" stroke-width="2" opacity=".55"/>`;
    s += `<line x1="${f(bx)}" y1="${BT}" x2="${f(ex)}" y2="${f(VY + (BT - VY) * k)}" stroke="#c9a227" stroke-width="1.5" opacity=".28"/>`;
  }
  for (let k = 1; k <= 7; k++) {
    const d = 1 / (1 - k * 0.105), half = HALF * d;
    s += `<line x1="${f(VX - half)}" y1="${f(VY + (BT - VY) * d)}" x2="${f(VX + half)}" y2="${f(VY + (BT - VY) * d)}" stroke="#c9a227" stroke-width="${f(1 + k * 0.4)}" opacity=".25"/>`;
    s += `<line x1="${f(VX - half)}" y1="${f(VY + (BB - VY) * d)}" x2="${f(VX + half)}" y2="${f(VY + (BB - VY) * d)}" stroke="#2b150a" stroke-width="${f(1 + k * 0.5)}" opacity=".4"/>`;
  }

  // back wall with bookcases and an arched window
  s += `<rect x="${BX}" y="${BT}" width="${W - 2 * BX}" height="${BB - BT}" fill="#2a160c"/>`;
  const r0 = rng(21), rowsBack = 7, rh = (BB - BT) / rowsBack;
  for (let row = 0; row < rowsBack; row++) {
    let x = BX + 6;
    while (x < W - BX - 6) {
      const w = 5 + Math.floor(r0() * 6), h = rh * (0.6 + r0() * 0.25);
      if (x + w > W - BX - 6) break;
      if (x + w < VX - 70 || x > VX + 70)
        s += `<rect x="${f(x)}" y="${f(BT + (row + 1) * rh - 4 - h)}" width="${w - 1}" height="${f(h)}" fill="${SPINES[Math.floor(r0() * SPINES.length)]}"/>`;
      x += w;
    }
    s += `<rect x="${BX}" y="${f(BT + (row + 1) * rh - 4)}" width="${W - 2 * BX}" height="4" fill="#6b3d22"/>`;
  }
  s += `<path d="M${VX - 70},${BB} V${BT + 110} A70,80 0 0 1 ${VX + 70},${BT + 110} V${BB} Z" fill="#3a1f10"/>`;
  s += `<path d="M${VX - 58},${BB} V${BT + 112} A58,68 0 0 1 ${VX + 58},${BT + 112} V${BB} Z" fill="url(#win)"/>`;
  s += `<path d="M${VX},${BT + 44} V${BB} M${VX - 58},${BT + 112} H${VX + 58} M${VX - 58},${BT + 200} H${VX + 58} M${VX - 29},${BT + 112} V${BB} M${VX + 29},${BT + 112} V${BB}" stroke="#3a1f10" stroke-width="3" fill="none"/>`;

  // side walls full of books
  const ROWS = 8, BAYS = 7, STEP = (1 - HALF / VX) / BAYS;
  for (const side of [-1, 1]) {
    const r = rng(side === -1 ? 3 : 11), X = (off) => VX + side * off;
    s += `<polygon points="${X(VX)},${f(yAt(0, 0))} ${X(HALF)},${BT} ${X(HALF)},${BB} ${X(VX)},${f(yAt(0, 1))}" fill="#1c0e08"/>`;
    for (let bay = 0; bay < BAYS; bay++) {
      const z0 = 1 - bay * STEP, z1 = 1 - (bay + 1) * STEP, n = 9 + bay;
      for (let row = 0; row < ROWS; row++) {
        const fTop = row / ROWS, fBot = (row + 1) / ROWS - 0.018;
        for (let b = 0; b < n; b++) {
          const za = z0 + ((z1 - z0) * (b + 0.08 * (b === 0))) / n, zb = z0 + ((z1 - z0) * (b + 1)) / n;
          const oa = HALF / za, ob = HALF / zb;
          const ft = fTop + (fBot - fTop) * (0.12 + r() * 0.26);
          const xa = X(oa), xb = X(ob);
          s += `<polygon points="${f(xa)},${f(yAt(xa, ft))} ${f(xb)},${f(yAt(xb, ft))} ${f(xb)},${f(yAt(xb, fBot))} ${f(xa)},${f(yAt(xa, fBot))}" fill="${SPINES[Math.floor(r() * SPINES.length)]}" stroke="#1c0e08" stroke-width=".6"/>`;
        }
      }
      // upright between bays
      const o1 = HALF / z1, o1b = HALF / (z1 + STEP * 0.07), xu = X(o1), xv = X(o1b);
      s += `<polygon points="${f(xu)},${f(yAt(xu, 0))} ${f(xv)},${f(yAt(xv, 0))} ${f(xv)},${f(yAt(xv, 1))} ${f(xu)},${f(yAt(xu, 1))}" fill="#7a4a26"/>`;
    }
    for (let row = 0; row <= ROWS; row++) {          // shelf boards
      const fa = row / ROWS - 0.018, fb = row / ROWS, xo = X(VX), xi = X(HALF);
      s += `<polygon points="${xo},${f(yAt(xo, fa))} ${xi},${f(yAt(xi, fa))} ${xi},${f(yAt(xi, fb))} ${xo},${f(yAt(xo, fb))}" fill="#6b3d22"/>`;
    }
    s += `<polygon points="${X(VX)},${f(yAt(0, 0))} ${X(HALF)},${BT} ${X(HALF)},${BB} ${X(VX)},${f(yAt(0, 1))}" fill="url(#${side === -1 ? 'depthL' : 'depthR'})"/>`;
  }
  s += `<rect width="${W}" height="${H}" fill="url(#glow)"/>`;
  return s + '</svg>';
}

/* ---------- 3. Theatre: side curtain and top valance ---------- */
function curtainSide() {
  // Left curtain, gathered by a gold tie-back; the right one is mirrored in CSS.
  const stops = [];
  for (let i = 0; i <= 12; i++) stops.push(`<stop offset="${f((i / 12) * 100)}%" stop-color="${i % 2 ? '#a3242f' : '#4a0b14'}"/>`);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 1000" preserveAspectRatio="none">`;
  s += `<defs><linearGradient id="folds" x1="0" y1="0" x2="1" y2="0">${stops.join('')}</linearGradient>`;
  s += `<linearGradient id="dark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset=".25" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>`;
  s += `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1d98a"/><stop offset=".5" stop-color="#c9a227"/><stop offset="1" stop-color="#8a6d1f"/></linearGradient></defs>`;
  const shape = 'M0,0 H220 C218,260 190,470 86,610 C140,720 168,860 172,1000 H0 Z';
  s += `<path d="${shape}" fill="url(#folds)"/>`;
  for (let i = 1; i <= 8; i++) {
    const tx = i * 25, bx = i * 20;
    s += `<path d="M${tx},0 C${tx},280 ${30 + i * 8},520 ${28 + i * 7},612 C${30 + i * 9},720 ${bx},860 ${bx},1000" fill="none" stroke="#2a060c" stroke-width="${i % 2 ? 5 : 3}" opacity=".45"/>`;
    s += `<path d="M${tx + 9},0 C${tx + 9},280 ${35 + i * 8},520 ${32 + i * 7},612 C${35 + i * 9},720 ${bx + 8},860 ${bx + 8},1000" fill="none" stroke="#d9606a" stroke-width="2" opacity=".28"/>`;
  }
  s += `<path d="${shape}" fill="url(#dark)"/>`;
  s += `<path d="M220,0 C218,260 190,470 86,610 C140,720 168,860 172,1000" fill="none" stroke="url(#gold)" stroke-width="5"/>`;
  s += `<path d="M0,592 C40,612 70,618 96,600 L100,622 C70,642 36,636 0,618 Z" fill="url(#gold)"/>`;
  s += `<path d="M84,618 l10,52 l-22,0 Z" fill="url(#gold)"/><path d="M73,670 h20 v46 h-20 Z" fill="#c9a227"/>`;
  for (let i = 0; i < 5; i++) s += `<line x1="${75 + i * 4}" y1="672" x2="${75 + i * 4}" y2="716" stroke="#8a6d1f" stroke-width="1"/>`;
  return s + '</svg>';
}

function valance() {
  // One scallop of the top drape; repeated horizontally in CSS.
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="120" viewBox="0 0 240 120">`;
  s += `<defs><linearGradient id="v" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a0b14"/><stop offset=".25" stop-color="#9c222d"/><stop offset=".5" stop-color="#b52c38"/><stop offset=".75" stop-color="#9c222d"/><stop offset="1" stop-color="#4a0b14"/></linearGradient>`;
  s += `<linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".5" stop-color="#000" stop-opacity="0"/></linearGradient></defs>`;
  s += `<path d="M0,0 H240 V52 C200,124 40,124 0,52 Z" fill="url(#v)"/>`;
  for (const k of [0.3, 0.55, 0.8]) s += `<path d="M0,${f(52 * k)} C40,${f(52 * k + 72 * k)} 200,${f(52 * k + 72 * k)} 240,${f(52 * k)}" fill="none" stroke="#2a060c" stroke-width="3" opacity=".4"/>`;
  s += `<path d="M0,0 H240 V52 C200,124 40,124 0,52 Z" fill="url(#top)"/>`;
  s += `<path d="M0,52 C40,124 200,124 240,52" fill="none" stroke="#c9a227" stroke-width="5"/>`;
  s += `<path d="M0,52 C40,124 200,124 240,52" fill="none" stroke="#f1d98a" stroke-width="7" stroke-dasharray="1.5 5" transform="translate(0,6)"/>`;
  s += `<circle cx="0" cy="56" r="7" fill="#c9a227"/><circle cx="240" cy="56" r="7" fill="#c9a227"/>`;
  return s + '</svg>';
}

writeFileSync(new URL('konyvespolc.svg', OUT), bookshelf());
writeFileSync(new URL('konyvtar.svg', OUT), library());
writeFileSync(new URL('fuggony-oldal.svg', OUT), curtainSide());
writeFileSync(new URL('fuggony-felso.svg', OUT), valance());
console.log('backgrounds written to src/assets/hatter/');
