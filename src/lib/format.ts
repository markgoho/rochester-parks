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
 * The `view-transition-name` of a park's row. The name must be unique in the
 * document and the same on every page that shows the row, so it comes from
 * the park's whole path, not from its position or its last segment. The
 * prefix keeps it a valid ident when a slug starts with a digit.
 */
export function parkRowTransitionName(path: string): string {
  const ident = path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `park-${ident}`;
}
