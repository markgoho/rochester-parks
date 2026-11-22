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

/**
 * The name of a Park's generated share image, under `/og/`, without `.png`
 * (#369). One flat name, since the route takes one segment.
 */
export function shareCardSlug(url: string): string {
  return url.replace(/^\/|\/$/g, '').replaceAll('/', '--');
}

/**
 * The path of a Park's or Trail's share image. A photo on disk makes it a
 * JPEG (a photo as PNG is too big for some chat apps); otherwise a PNG of
 * its outline. `photo` is as `ParkMeta.photo` has it.
 */
export function shareCardPath(url: string, photo?: string): string {
  return `/og/${shareCardSlug(url)}.${hasPhotoCard(photo) ? 'jpg' : 'png'}`;
}

/** Whether a photo, as `ParkMeta.photo` has it, is a file on this site. */
export function hasPhotoCard(photo?: string): boolean {
  return !!photo && !/^https?:\/\//.test(photo);
}
