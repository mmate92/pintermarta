// Shrinks the migrated images in place (max 1600 px, JPEG quality 84) and
// converts opaque PNGs to JPEG, updating the Markdown references.
// Run from the project root:  node tools/shrink-images.mjs
import { readdirSync, readFileSync, writeFileSync, statSync, unlinkSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import sharp from 'sharp';

const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]));
const renamed = new Map();
let before = 0, after = 0;
for (const file of [...walk('src/assets/kepek'), ...walk('src/assets/galeria')]) {
  const ext = extname(file).toLowerCase();
  if (!['.jpg', '.png'].includes(ext)) continue;
  const size = statSync(file).size;
  before += size;
  const input = readFileSync(file);
  const img = sharp(input).rotate();
  const { hasAlpha } = await img.metadata();
  const opaque = !hasAlpha || (await img.stats()).isOpaque;
  const resized = img.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
  if (ext === '.png' && !opaque) {
    const out = await resized.png({ compressionLevel: 9 }).toBuffer();
    if (out.length < size) writeFileSync(file, out);
    after += Math.min(out.length, size);
    continue;
  }
  const out = await resized.jpeg({ quality: 84, mozjpeg: true }).toBuffer();
  if (ext === '.png') {
    const target = file.slice(0, -4) + '.jpg';
    writeFileSync(target, out); unlinkSync(file);
    renamed.set(basename(file), basename(target));
    after += out.length;
  } else {
    if (out.length < size * 0.9) writeFileSync(file, out);
    after += Math.min(out.length, size);
  }
}
for (const md of walk('src/content')) {
  let text = readFileSync(md, 'utf8'), changed = false;
  for (const [from, to] of renamed) if (text.includes(from)) { text = text.replaceAll(from, to); changed = true; }
  if (changed) writeFileSync(md, text);
}
console.log(`images: ${(before / 1e6).toFixed(0)} MB -> ${(after / 1e6).toFixed(0)} MB, ${renamed.size} PNGs converted`);
