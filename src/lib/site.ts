export const SITE_URL = 'https://rochesterparks.org';
export const SITE_TITLE = 'Rochester Parks';

/** Absolute URL for a site-relative path, like Hugo's absURL. */
export function absUrl(path: string): string {
  return `${SITE_URL}/${path.replace(/^\//, '')}`;
}
