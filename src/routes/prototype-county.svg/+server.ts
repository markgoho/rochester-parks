// PROTOTYPE (#310): throwaway. The one county map every result in variant D
// shares. Styles are inline: document rules do not reach into a `<use>`.
import { COUNTY_VIEW_BOX, MUNICIPALITIES } from '#lib/municipalities.js';
import { GENESEE_RIVER } from '#lib/waterways.js';

export const prerender = true;

export function GET() {
  const towns = MUNICIPALITIES.filter((m) => !m.within)
    .map((m) => `<path vector-effect="non-scaling-stroke" d="${m.paths.join(' ')}"/>`)
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${COUNTY_VIEW_BOX}">` +
    `<g id="county"><g style="fill:var(--land);stroke:var(--rule-strong);stroke-width:1;stroke-linejoin:round">${towns}</g>` +
    `<path vector-effect="non-scaling-stroke" style="fill:none;stroke:var(--water);stroke-width:1.5" d="${GENESEE_RIVER}"/></g></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
}
