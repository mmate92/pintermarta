// Builds the search index: one entry per item (a heading and the text under
// it) of every page in src/content/oldalak. Loaded by the search panel.
import type { APIRoute } from 'astro';
import type { ImageMetadata } from 'astro';
import { getCollection, render } from 'astro:content';
import { getImage } from 'astro:assets';
import { url } from '../lib/url';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/kepek/**/*.{jpg,jpeg,png,webp}', { eager: true });

/** Markdown → plain text for searching and for the result snippet. */
function plain(md: string) {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')            // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')           // links: keep the text
    .replace(/<https?:[^>]*>/g, ' ')                   // bare addresses
    .replace(/^\s*\|?[\s:|-]+\|\s*$/gm, ' ')           // table rulers
    .replace(/^\s*(?:[-*+]|\d+\.)\s+/gm, '')           // list markers
    .replace(/[*_`|\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const GET: APIRoute = async () => {
  const entries = [];
  for (const page of await getCollection('oldalak')) {
    if (page.id === 'galeria' || !page.body) continue;
    const { headings } = await render(page);
    const pageUrl = url(page.id === 'hirek' ? '/' : `/${page.id}/`);
    const pageTitle = page.id === 'hirek' ? 'Főoldal' : page.data.title;

    // walk the text: every heading starts a new item
    let next = 0;
    let item = { title: '', anchor: '', lines: [] as string[] };
    const items = [item];
    for (const line of page.body.split('\n')) {
      if (/^#{1,6}\s/.test(line) && next < headings.length) {
        const h = headings[next++];
        item = { title: h.text, anchor: h.slug, lines: [] };
        items.push(item);
      } else if (!/^---\s*$/.test(line)) {
        item.lines.push(line);
      }
    }
    for (const it of items) {
      const body = it.lines.join('\n');
      const text = plain(body);
      const picture = body.match(/!\[[^\]]*\]\(\.\.\/\.\.\/assets\/(kepek\/[^)]+)\)/)?.[1];
      if (!text && !picture && !it.title) continue;
      if (!text && !picture && it.anchor && headings.find((h) => h.slug === it.anchor)?.depth === 2) continue; // bare section title
      const source = picture ? images[`../assets/${picture}`]?.default : undefined;
      entries.push({
        p: pageTitle,
        t: it.title || page.data.title,
        u: it.anchor ? `${pageUrl}#${it.anchor}` : pageUrl,
        x: text,
        i: source ? (await getImage({ src: source, width: 144, height: 144, fit: 'cover' })).src : undefined,
      });
    }
  }
  return new Response(JSON.stringify(entries), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
