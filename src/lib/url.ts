/** Prefix an internal path ('/konyvek/') with the site's base path. */
export const url = (path: string) => import.meta.env.BASE_URL.replace(/\/$/, '') + path;
