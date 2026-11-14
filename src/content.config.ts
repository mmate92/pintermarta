import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every Markdown file in src/content/oldalak is one page of the site.
const oldalak = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/oldalak' }),
  schema: z.object({
    title: z.string(),
    // 'boritok': show each image beside its item's text (pages listing books and studies)
    stilus: z.enum(['boritok']).optional(),
    // show this many items (blocks separated by ---) per page, with a pager
    lapozas: z.number().int().positive().optional(),
  }),
});

export const collections = { oldalak };
