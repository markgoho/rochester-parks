import {
  isCitySection,
  isCountySection,
  municipality,
  outlineBox,
  placeAt,
  project,
  runsThrough,
  squareBox,
  townAt,
  townKey,
  villagesIn,
  type Outline,
} from './municipalities.js';
import { neighborhoodAt } from './neighborhoods.js';
import { ERIE_CANAL, GENESEE_RIVER } from './waterways.js';
import type { ParkMeta } from './types.js';

/**
 * The town or Neighborhood outline a Park's or Trail's point stands in, with
 * its villages: the same shape choice `ParkSingle.svelte` draws (its `shape`
 * and `villages`), mirrored here because a search result's map is a string
 * built from the map helpers, not rendered from that component (#310, #323).
 * Undefined wherever the Park page instead falls back to its city-wide or
 * county-wide locator, or the point stands in no town or Neighborhood at all.
 */
export function placeShape(
  meta: ParkMeta,
  isTrail: boolean
): { shape: Outline; villages: Outline[] } | undefined {
  if (!meta.geo) return undefined;
  const { latitude, longitude } = meta.geo;
  // A Trail sits in one flat `/trails/` section (ADR-0006), never a city or
  // county one, so it always takes the county-wide lookup a county Park does.
  const city = !isTrail && isCitySection(meta.section.url);
  if (city) {
    const shape = neighborhoodAt(latitude, longitude);
    return shape ? { shape, villages: [] } : undefined;
  }
  const county = !isTrail && isCountySection(meta.section.url);
  const town =
    isTrail || county
      ? placeAt(latitude, longitude)
      : (townAt(latitude, longitude) ?? townKey(meta.section.url));
  const shape = town ? municipality(town) : undefined;
  return shape ? { shape, villages: villagesIn(town!) } : undefined;
}

/** A dot larger than the Park page's own 0.028: legible at this size (#310). */
const DOT_RADIUS = 0.06;

/** One decimal: the box and dot are already only as precise as the stroke
 * width at this size, and the fragment's byte cost was measured at this
 * precision (#310). */
const round = (n: number) => Math.round(n * 10) / 10;

/** The id an SVG's `<clipPath>` takes, unique in a dialog of many results
 * because it is keyed to the result's own page URL. */
function mapClipId(url: string): string {
  const slug = url.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  return `search-map-${slug || 'home'}`;
}

/**
 * A search result's place map (#310, #323): the town or Neighborhood outline
 * from `placeShape`, its villages, the Genesee River and the Erie Canal
 * where they run through it, and the Park's orange dot. A string, built from
 * the map helpers rather than rendered from `TownShape.svelte`, because a
 * server-render import would go into the client build (`/find` hydrates) and
 * each result needs its own, unique `<clipPath>` id.
 */
export function placeMapSvg(
  meta: ParkMeta,
  isTrail: boolean,
  url: string
): string | undefined {
  const found = placeShape(meta, isTrail);
  if (!found) return undefined;
  const { shape, villages } = found;
  const { latitude, longitude } = meta.geo!;
  const box = squareBox(outlineBox(shape));
  const clip = mapClipId(url);
  const dot = project(latitude, longitude);
  const side = Math.max(box.width, box.height);
  const outline = shape.paths.join(' ');
  const water =
    (runsThrough(shape, GENESEE_RIVER)
      ? `<path class="water river" vector-effect="non-scaling-stroke" clip-path="url(#${clip})" d="${GENESEE_RIVER}"/>`
      : '') +
    (runsThrough(shape, ERIE_CANAL)
      ? `<path class="water canal" vector-effect="non-scaling-stroke" clip-path="url(#${clip})" d="${ERIE_CANAL}"/>`
      : '');
  const villagePaths = villages
    .map(
      (v) =>
        `<path class="village" vector-effect="non-scaling-stroke" clip-path="url(#${clip})" d="${v.paths.join(' ')}"/>`
    )
    .join('');
  return (
    `<svg viewBox="${round(box.x)} ${round(box.y)} ${round(box.width)} ${round(box.height)}" aria-hidden="true">` +
    `<clipPath id="${clip}"><path d="${outline}"/></clipPath>` +
    `<path class="outline" vector-effect="non-scaling-stroke" d="${outline}"/>` +
    villagePaths +
    water +
    `<circle class="dot" vector-effect="non-scaling-stroke" cx="${round(dot.x)}" cy="${round(dot.y)}" r="${round(side * DOT_RADIUS)}"/>` +
    `</svg>`
  );
}
