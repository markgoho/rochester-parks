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
import { parkFrame } from './park-shapes.js';
import { ERIE_CANAL, GENESEE_RIVER } from './waterways.js';
import type { ParkMeta } from './types.js';

/** Where a Park's or Trail's point stands, as its maps draw it. */
export interface PlaceShape {
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
export function placeShape(
  meta: ParkMeta,
  isTrail: boolean
): PlaceShape | undefined {
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
    villages: shape ? villagesIn(town!) : [],
    where: shape?.label.text ?? (county ? 'Monroe County' : undefined),
  };
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
 * beside each, the `oklch` ones every current browser takes
 * (search-map.test.ts holds them equal). Class names match
 * `TownShape.svelte` and `ParkShape.svelte`, so they stay easy to compare.
 */
export const MAP_STYLE: Record<string, string> = {
  '--land': 'oklch(84.66% 0.0224 138.9)',
  '--paper-sunk': 'oklch(90.63% 0.0198 90.27)',
  '--rule-strong': 'oklch(78.24% 0.036 89)',
  '--water': 'oklch(53.55% 0.0867 241.91)',
  '--orange': 'oklch(61.28% 0.1741 40.62)',
  '--ink': 'oklch(25.94% 0.0343 159.44)',
  '--ink-soft': 'oklch(37.87% 0.033 159.49)',
  '--park': 'oklch(64.6% 0.0829 142.5)',
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
  `.land{fill:${css('--park')};fill-rule:evenodd;stroke:${css('--ink-soft')};stroke-width:${css('--stroke-base')}}` +
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
  if (!found?.shape) return undefined;
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

/**
 * A search result's picture when the Park has no photo but has an outline
 * (#341): its own land, framed square the way its card frames it
 * (`ParkShape.svelte` with `square`). Served at `<page>/map.svg` like the
 * place map, for the same reason (#333).
 */
export function parkShapeSvg(paths: string[]): string {
  const { viewBox } = parkFrame(paths, { square: true });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">` +
    STYLE +
    paths.map((d) => `<path class="land" d="${d}"/>`).join('') +
    `</svg>`
  );
}
