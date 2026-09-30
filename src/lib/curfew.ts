import { isCountySection } from './municipalities.js';
import type { CurfewView, ParkMeta } from './types.js';

/**
 * The Monroe County Parks Law closes every county Park from 10 p.m. to 6 a.m.
 * (Ch. 323, § 323-3). Recorded once here for the whole county system, not in
 * the front matter of each Park, and dated as ADR-0004 asks.
 */
const COUNTY_CURFEW: CurfewView & { checkedOn: string } = {
  // No-break spaces keep each time whole when the line wraps.
  closed: 'Closed 10\u00a0p.m. to 6\u00a0a.m.',
  // Monroe County Code § 323-3, on the county's own code site.
  law: { name: 'county law', url: 'https://ecode360.com/11941689' },
  checkedOn: '2026-09-29',
};

/**
 * The Curfew a Park page shows, if any. A Curfew says when a Park is closed,
 * not that it is open at all other hours, so it is not opening hours and
 * never reaches the JSON-LD. A Park with grounds hours already shows its
 * close, so it gets none.
 */
export function curfewOf(meta: ParkMeta): CurfewView | undefined {
  if (!isCountySection(meta.section.url)) return undefined;
  if (meta.openingHours?.length) return undefined;
  const { closed, law } = COUNTY_CURFEW;
  return { closed, law };
}
