import { NEIGHBORHOOD_OUTLINES } from './neighborhood-outlines';
import { contains, outlineBox, type Outline } from './municipalities';

/**
 * The city's neighborhoods, from its own boundary layer. They are to the city
 * what the towns are to the county. The airport land is in no neighborhood.
 */
export const NEIGHBORHOODS: Outline[] = NEIGHBORHOOD_OUTLINES;

/** The neighborhood a place falls in, or undefined outside all of them. */
export function neighborhoodAt(
  latitude: number,
  longitude: number
): Outline | undefined {
  return NEIGHBORHOODS.find((n) => contains(n, latitude, longitude));
}

/** The box that holds every neighborhood: the city map's `viewBox`. */
export const CITY_BOX = outlineBox({
  key: 'city',
  name: 'City of Rochester',
  paths: NEIGHBORHOODS.flatMap((n) => n.paths),
});
