import type { ChildLink, ParkMeta } from './types.js';

/**
 * The one predicate every count, map, list and index reads instead of
 * re-testing `former` for itself (ADR-0010).
 */
export function isFormerPark(meta: ParkMeta): boolean {
  return meta.former;
}

/**
 * The one seam that separates a Former Park from the active ones (ADR-0010).
 * Every count, map, and list reads from this split rather than re-filtering
 * on `former` in each layout.
 */
export function splitFormerParks(children: ChildLink[]): {
  active: ChildLink[];
  former: ChildLink[];
} {
  const active: ChildLink[] = [];
  const former: ChildLink[] = [];
  for (const child of children) {
    (child.park && isFormerPark(child.park) ? former : active).push(child);
  }
  return { active, former };
}
