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
