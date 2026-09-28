import {
  isCitySection,
  isCountySection,
  municipality,
  placeAt,
  townAt,
  townKey,
  villagesIn,
  type Outline,
} from './municipalities.js';
import { neighborhoodAt } from './neighborhoods.js';
import type { ParkMeta } from './types.js';

/** Where a Park's or Trail's point stands, as its maps draw it. */
export interface MapPlace {
  /** Filed in the city section: drawn on its Neighborhood, and on the
   * city-wide locator when its point stands in none. */
  city: boolean;
  /** The Neighborhood a City Park stands in. */
  neighborhood?: Outline;
  /** The town or Neighborhood outline to draw; undefined where the Park page
   * falls back to its city-wide or county-wide locator. */
  shape?: Outline;
  /** The villages inside `shape`, when it is a town. */
  villages: Outline[];
  /** The place's name, for the map's label. Undefined when the point stands
   * in no place at all, and then the Park page draws no map. */
  where?: string;
}

/**
 * Where a Park's or Trail's point stands (#334): the one shape choice both
 * the Park page (`ParkSingle.svelte`) and its search result's map
 * (`placeMapSvg`, #310, #323) draw, so the two never disagree. The
 * coordinates decide it, so a Park filed under one section but standing in
 * another is shown where it really is; the section is only the fallback. A
 * County Park has no town section to fall back on, and several stand in the
 * city, so the city counts as a place for it. A City Park is drawn on its
 * Neighborhood instead. A County Park outside every outline is still placed
 * in the county, and a City Park outside every Neighborhood in the city.
 * Undefined when the Park has no point.
 */
export function mapPlace(
  meta: ParkMeta,
  isTrail: boolean
): MapPlace | undefined {
  if (!meta.geo) return undefined;
  const { latitude, longitude } = meta.geo;
  // A Trail sits in one flat `/trails/` section (ADR-0006), never a city or
  // county one, so it always takes the county-wide lookup a County Park
  // does, and never the Neighborhood one, even inside Rochester (it draws
  // the city's own outline there, the same one the county-wide map uses).
  const city = !isTrail && isCitySection(meta.section.url);
  if (city) {
    const neighborhood = neighborhoodAt(latitude, longitude);
    return {
      city,
      neighborhood,
      shape: neighborhood,
      villages: [],
      where: neighborhood?.name ?? 'Rochester',
    };
  }
  const county = !isTrail && isCountySection(meta.section.url);
  const town =
    isTrail || county
      ? placeAt(latitude, longitude)
      : (townAt(latitude, longitude) ?? townKey(meta.section.url));
  const shape = town ? municipality(town) : undefined;
  return {
    city,
    shape,
    villages: town && shape ? villagesIn(town) : [],
    where: shape?.label.text ?? (county ? 'Monroe County' : undefined),
  };
}
