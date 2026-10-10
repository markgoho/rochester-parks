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

/**
 * A post's document id: HMAC-SHA256 of its page, email and body with the
 * site's key, the first 20 characters as base64url, the length of a
 * Firestore id. The email's case and the body's whitespace do not count, so
 * a resent post with `\r\n` for `\n` has the same id. The key keeps the
 * email out of the id, which a public announcement shows.
 */
export function postId(
  page: string,
  email: string,
  body: string,
  key: string
): string {
  return createHmac('sha256', key)
    .update([page, email.toLowerCase(), body.replace(/\s+/g, ' ')].join('\0'))
    .digest('base64url')
    .slice(0, 20);
}
