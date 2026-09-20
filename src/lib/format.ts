/**
 * Print an acreage the way the source records it. Small parks are measured to
 * a fraction of an acre, large ones to the nearest acre, so one rule for both
 * would either round Goodwin Park away or give Black Creek Park false
 * precision.
 */
export function formatAcres(acres: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: acres < 10 ? 2 : 0,
  }).format(acres);
}

/**
 * The `view-transition-name` of one part of a park: its row in a Park List, or
 * its name, which is the same on the list and on the Park page. The name must
 * be unique in the document and the same on every page that shows the part,
 * so it comes from the park's whole path, not from its position or its last
 * segment. The part goes first, which keeps the name a valid ident when a slug
 * starts with a digit.
 */
export function parkTransitionName(path: string, part: 'row' | 'name'): string {
  const ident = path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${part}-${ident}`;
}

/**
 * A park's point as a reader copies it into a map. Four places is about eleven
 * metres, finer than a park. The sign stays a hyphen-minus, because a map app
 * does not read the typographic minus sign.
 */
export function formatCoordinates(geo: {
  latitude: number;
  longitude: number;
}): string {
  return `${geo.latitude.toFixed(4)}, ${geo.longitude.toFixed(4)}`;
}

/**
 * The letters in the longest part of a name that a line cannot break, for a
 * heading that must fit its longest word. A line breaks at a space and after a
 * hyphen. A capitalised word is never hyphenated, so without this a long name
 * runs past a phone screen.
 */
export function longestWord(text: string): number {
  return Math.max(0, ...text.split(/\s+|(?<=-)/).map((word) => word.length));
}

/**
 * A telephone number as a link a telephone can dial. The printed number stays
 * as the source writes it, because a reader reads it; the link holds digits
 * only. Ten digits are a North American number, so the country code is added.
 */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `tel:+1${digits}`;
  if (phone.trimStart().startsWith('+')) return `tel:+${digits}`;
  return `tel:${digits}`;
}
