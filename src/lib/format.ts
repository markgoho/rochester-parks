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
