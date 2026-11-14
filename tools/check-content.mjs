// Verifies that restructuring a Markdown page lost nothing: compares the file
// on disk with the committed version (words, links, images).
// Usage:  node tools/check-content.mjs src/content/oldalak/konyvek.md [more files]
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const REF = process.env.REF || '641ba0e';
const urls = (t) => [...t.matchAll(/\]\(([^)\s]+)\)|<(https?:[^>\s]+)>/g)].map((m) => m[1] || m[2]);
const words = (t) =>
  t.replace(/^---[\s\S]*?\n---/, '')
    .replace(/\]\([^)]*\)/g, ' ').replace(/<https?:[^>]*>/g, ' ')
    .toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const count = (list) => list.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());
const missing = (a, b) => { const cb = count(b), out = []; for (const [k, n] of count(a)) if ((cb.get(k) || 0) < n) out.push(`${k}${n - (cb.get(k) || 0) > 1 ? ' ×' + (n - (cb.get(k) || 0)) : ''}`); return out; };

let bad = false;
for (const file of process.argv.slice(2)) {
  const before = execFileSync('git', ['show', `${REF}:${file}`], { encoding: 'utf8' });
  const after = readFileSync(file, 'utf8');
  const lostWords = missing(words(before), words(after)), newWords = missing(words(after), words(before));
  const lostUrls = missing(urls(before), urls(after)), newUrls = missing(urls(after), urls(before));
  console.log(`\n== ${file}`);
  console.log(`  words lost (${lostWords.length}): ${lostWords.join(', ') || '-'}`);
  console.log(`  words added (${newWords.length}): ${newWords.join(', ') || '-'}`);
  console.log(`  links/images lost (${lostUrls.length}): ${lostUrls.join('\n    ') || '-'}`);
  console.log(`  links/images added (${newUrls.length}): ${newUrls.join('\n    ') || '-'}`);
  if (lostWords.length || lostUrls.length || newUrls.length) bad = true;
}
process.exit(bad ? 1 : 0);
