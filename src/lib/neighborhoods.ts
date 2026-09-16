import { NEIGHBORHOOD_OUTLINES } from './neighborhood-outlines';
import { contains, outlineBox, type Outline } from './municipalities';

/**
 * The city's neighborhoods, from its own boundary layer. They are to the city
 * what the towns are to the county. The airport land is in no neighborhood.
 * Largest first, which is the order to draw them in.
 */
export const NEIGHBORHOODS: Outline[] = NEIGHBORHOOD_OUTLINES;

/**
 * The neighborhood a place falls in, or undefined outside all of them. Where
 * two overlap, the smaller, more specific one wins.
 */
export function neighborhoodAt(
  latitude: number,
  longitude: number
): Outline | undefined {
  return NEIGHBORHOODS.findLast((n) => contains(n, latitude, longitude));
}

/** The box that holds every neighborhood: the city map's `viewBox`. */
export const CITY_BOX = outlineBox({
  key: 'city',
  name: 'City of Rochester',
  paths: NEIGHBORHOODS.flatMap((n) => n.paths),
});

/** Where a Neighborhood's parks are listed: its group on the city page. */
export function neighborhoodUrl(key: string): string {
  return `/rochester-city-parks/by-neighborhood/#${key}`;
}
