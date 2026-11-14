import { defineConfig } from 'astro/config';

// When the custom domain is connected, put it here (e.g. 'pintermarta.hu').
// While it is empty the site is built for https://mmate92.github.io/pintermarta/.
const CUSTOM_DOMAIN = 'pintermartazsuzsanna.hu';
const GITHUB_USER = 'mmate92';
const REPOSITORY = 'pintermarta';

const base = CUSTOM_DOMAIN ? '/' : `/${REPOSITORY}/`;

export default defineConfig({
  site: CUSTOM_DOMAIN ? `https://${CUSTOM_DOMAIN}` : `https://${GITHUB_USER}.github.io`,
  base,
});
