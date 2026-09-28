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

/** Room around the square box, as a share of its side: the dot's radius and
 * a little more for its stroke. An `<img>` clips at its own edge, so a dot
 * near the town line would otherwise lose its outer half (#333). */
const PAD = DOT_RADIUS * 1.25;

/** One decimal: the box and dot are already only as precise as the stroke
 * width at this size, and the fragment's byte cost was measured at this
 * precision (#310). */
const round = (n: number) => Math.round(n * 10) / 10;

/**
 * The map's own styles. The map is a file shown with `<img>`, so the page's
 * CSS does not reach it: these are the values of the `app.css` tokens named
 * beside each (search-map.test.ts holds them equal). Class names match
 * `TownShape.svelte`, so the two stay easy to compare.
 */
export const MAP_STYLE: Record<string, string> = {
  '--land': 'hsl(107 13% 79%)',
  '--paper-sunk': 'hsl(44 27% 86%)',
  '--rule-strong': 'hsl(43 22% 69%)',
  '--water': 'hsl(205 45% 42%)',
  '--orange': 'hsl(18 75% 48%)',
  '--ink': 'hsl(148 34% 12%)',
  '--stroke-thin': '0.8px',
  '--stroke-base': '1.2px',
  '--stroke-water': '2px',
  '--stroke-river': '3px',
};

const css = (token: string) => MAP_STYLE[token];

const STYLE =
  `<style>` +
  `path{vector-effect:non-scaling-stroke;stroke-linejoin:round}` +
  `.outline{fill:${css('--land')};stroke:${css('--rule-strong')};stroke-width:${css('--stroke-thin')}}` +
  `.village{fill:${css('--paper-sunk')};stroke:${css('--rule-strong')};stroke-width:${css('--stroke-thin')}}` +
  `.water{fill:none;stroke:${css('--water')};stroke-width:${css('--stroke-water')};stroke-linecap:round}` +
  `.river{stroke-width:${css('--stroke-river')}}` +
  `.dot{fill:${css('--orange')};stroke:${css('--ink')};stroke-width:${css('--stroke-base')};vector-effect:non-scaling-stroke}` +
  `</style>`;

/**
 * A search result's place map (#310, #323): the town or Neighborhood outline
 * from `placeShape`, its villages, the Genesee River and the Erie Canal
 * where they run through it, and the Park's orange dot. A whole SVG file,
 * served at `<page>/map.svg` and shown in a result with `<img>` (#333):
 * Pagefind makes every meta value searchable, so the SVG text itself must
 * never be a meta value, or "river", "canal" and "village" find every Park
 * whose map draws one. Built from the map helpers rather than rendered from
 * `TownShape.svelte`, because a server-render import would go into the
 * client build (`/find` hydrates).
 */
export function placeMapSvg(
  meta: ParkMeta,
  isTrail: boolean
): string | undefined {
  const found = placeShape(meta, isTrail);
  if (!found) return undefined;
  const { shape, villages } = found;
  const { latitude, longitude } = meta.geo!;
  const box = squareBox(outlineBox(shape));
  const dot = project(latitude, longitude);
  const side = Math.max(box.width, box.height);
  const pad = side * PAD;
  const outline = shape.paths.join(' ');
  const water =
    (runsThrough(shape, GENESEE_RIVER)
      ? `<path class="water river" clip-path="url(#shape)" d="${GENESEE_RIVER}"/>`
      : '') +
    (runsThrough(shape, ERIE_CANAL)
      ? `<path class="water canal" clip-path="url(#shape)" d="${ERIE_CANAL}"/>`
      : '');
  const villagePaths = villages
    .map(
      (v) =>
        `<path class="village" clip-path="url(#shape)" d="${v.paths.join(' ')}"/>`
    )
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${round(box.x - pad)} ${round(box.y - pad)} ${round(side + 2 * pad)} ${round(side + 2 * pad)}">` +
    STYLE +
    `<clipPath id="shape"><path d="${outline}"/></clipPath>` +
    `<path class="outline" d="${outline}"/>` +
    villagePaths +
    water +
    `<circle class="dot" cx="${round(dot.x)}" cy="${round(dot.y)}" r="${round(side * DOT_RADIUS)}"/>` +
    `</svg>`
  );
}
