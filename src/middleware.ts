import { defineMiddleware } from 'astro:middleware';

// Links written in the Markdown files start at the site root, e.g.
// (/letoltesek/x.pdf) or (/konyvek/). While the site lives under
// mmate92.github.io/pintermarta/ they need that prefix; this adds it at build
// time, so the content never has to change when the domain does.
const base = import.meta.env.BASE_URL.replace(/\/$/, '');

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (!base || !response.headers.get('content-type')?.includes('text/html')) return response;
  const html = await response.text();
  const prefixed = html.replace(/href="\/(?!\/)([^"]*)"/g, (match, path) =>
    ('/' + path).startsWith(base + '/') || '/' + path === base ? match : `href="${base}/${path}"`,
  );
  return new Response(prefixed, { status: response.status, headers: response.headers });
});
