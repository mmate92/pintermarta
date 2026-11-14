import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every Markdown file in src/content/oldalak is one page of the site.
const oldalak = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/oldalak' }),
  schema: z.object({ title: z.string() }),
});

export const collections = { oldalak };
