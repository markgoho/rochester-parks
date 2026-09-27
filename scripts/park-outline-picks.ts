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
> = {
  /**
   * The Town of Greece runs 375 acres inside the state's Braddock Bay Wildlife
   * Management Area, but those acres are no tax parcel of their own: the land
   * is one 1,764-acre state parcel. The state land that the DEC does not map
   * as the WMA comes to 328 acres in five separate pieces, and only 58 of
   * them touch the page's point. This is the county parcel at the Park's own
   * address, 199 East Manitou Road: 84 of the 375 acres, certain but short.
   */
  '/town-parks/greece-parks/braddock-bay-park/': {
    layer: 'county parcels',
    ids: ['26280002504000040150000000'],
  },
};
