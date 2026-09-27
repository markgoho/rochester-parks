/**
 * Hand-picked outlines for Parks that `scripts/park-outlines.ts` cannot place
 * on its own, or places wrong. Each entry names the layer and the feature
 * ids to fetch by id, with no point search and no growth: `scripts/
 * park-outlines.ts` never overwrites a picked Park from its own search, and
 * marks its outline `source.picked: true`.
 *
 * Key: the Park page's URL. Add an entry, then rerun `bun scripts/
 * park-outlines.ts`.
 */
export const PICKS: Record<
  string,
  { layer: 'county parks' | 'county parcels' | 'city parcels'; ids: string[] }
> = {};
