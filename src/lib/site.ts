export const SITE_URL = 'https://rochesterparks.org';
export const SITE_TITLE = 'Rochester Parks';
/**
 * The Pagefind Component UI's own script, loaded by tag rather than a Vite
 * import (#318). One name for it, since it is loaded two ways: by a script
 * tag on every page but /find, and after hydration on /find itself (see
 * +layout.svelte and routes/find/+page.svelte).
 */
export const PAGEFIND_UI_SRC = '/pagefind/pagefind-component-ui.js';

/** Absolute URL for a site-relative path, like Hugo's absURL. */
export function absUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\//, '')}`;
}
