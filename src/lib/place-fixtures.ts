/** Parks at known points, shared by the tests of the maps that place them. */
import type { ParkMeta } from './types.js';

export const baseMeta: ParkMeta = {
  amenities: [],
  wordCount: 0,
  photoCount: 0,
  commentCount: 0,
  status: { written: false, inventoried: false, photographed: false },
  links: [],
  section: { title: 'Henrietta', url: '/town-parks/henrietta-parks/' },
  former: false,
  planned: false,
};

/** West High Park: a City Park in the 19th Ward. */
export const westHigh: ParkMeta = {
  ...baseMeta,
  section: { title: 'Rochester', url: '/rochester-city-parks/' },
  geo: { latitude: 43.1430704, longitude: -77.6381868 },
};

/** Mendon Ponds Park: a County Park standing in the Town of Mendon, which
 * holds the Village of Honeoye Falls. */
export const mendonPonds: ParkMeta = {
  ...baseMeta,
  section: { title: 'Monroe County', url: '/monroe-county-parks/' },
  geo: { latitude: 43.021062601092915, longitude: -77.57617948425705 },
};

/** Egypt Park: a Town Park in Perinton, which holds the Village of
 * Fairport. */
export const egyptPark: ParkMeta = {
  ...baseMeta,
  section: { title: 'Perinton', url: '/town-parks/perinton-parks/' },
  geo: { latitude: 43.063189, longitude: -77.3987923 },
};

/** High Falls State Park: stands in the City of Rochester, but under the
 * state section, so it takes neither the city's Neighborhood lookup nor a
 * town's: the same fallback the Park page takes to its TownLocator. */
export const highFalls: ParkMeta = {
  ...baseMeta,
  section: { title: 'State', url: '/state-parks/' },
  geo: { latitude: 43.161314, longitude: -77.6134002 },
};

/** A point far outside Monroe County: in no town and no Neighborhood. */
export const outside = { latitude: 42.5, longitude: -76.5 };
