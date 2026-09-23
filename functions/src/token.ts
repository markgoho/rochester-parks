import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The page token: HMAC-SHA256 of the page path with the site's key, as hex.
 * The build writes it into each comment form and the Function recomputes it,
 * so a post is accepted only for a page the build signed (#24). The site's
 * content loader imports this file too, so the two can never disagree.
 */
export function pageToken(path: string, key: string): string {
  return createHmac('sha256', key).update(path).digest('hex');
}

/** Whether a posted token is the one the build wrote for this path. */
export function tokenMatches(
  path: string,
  token: string,
  key: string
): boolean {
  if (!key) return false;
  const expected = Buffer.from(pageToken(path, key));
  const given = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
