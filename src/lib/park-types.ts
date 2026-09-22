/**
 * What counts as a Park page, shared by `src/lib/server/content.ts` and
 * `scripts/reading-level.ts` so the two cannot drift on the definition.
 */

/**
 * Front-matter `type` values that mark a Park page. Most Park pages carry
 * `type: 'park'`, but the Monroe County section carries `type: 'county-parks'`
 * on its `index.md` pages instead.
 */
export const PARK_TYPES = new Set(['park', 'county-parks']);

/** Whether a page's front-matter `type` marks it as a Park. */
export function isParkType(type: string | undefined): boolean {
  return type !== undefined && PARK_TYPES.has(type);
}

/**
 * The front-matter `type` that marks a Trail page (ADR-0006). Disjoint from
 * `PARK_TYPES`: a Trail is not a Park, even when a government calls it one.
 */
export const TRAIL_TYPES = new Set(['trail']);

/** Whether a page's front-matter `type` marks it as a Trail. */
export function isTrailType(type: string | undefined): boolean {
  return type !== undefined && TRAIL_TYPES.has(type);
}

/**
 * Sections that group parks rather than being one. A Park's `type` cascades
 * nowhere, but the town sections carry it too, so depth is what separates
 * them: `/town-parks/greece-parks/` holds parks, `/monroe-county-parks/x/`
 * is one.
 */
export function isParkContainer(url: string): boolean {
  const segments = url.split('/').filter(Boolean);
  if (segments.length <= 1) return true;
  return segments.length === 2 && segments[0] === 'town-parks';
}
