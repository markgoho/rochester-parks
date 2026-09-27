// PROTOTYPE (#298): throwaway. The result template for every Pagefind
// results list: the name, the second line from #297, then the excerpt. It is
// a string because Svelte would read the {{ }} as its own expressions.
export const RESULT_TEMPLATE = `<script type="text/pagefind-template">
<li class="pf-result">
  <div class="pf-result-card">
   <div class="pr-row">
    <div class="pr-fig">{{#if meta.map}}<span class="pr-map">{{+ meta.map +}}</span>{{/if}}{{#if meta.shape}}<span class="pr-shape">{{+ meta.shape +}}</span>{{/if}}{{#if meta.dot}}<span class="pr-county"><svg viewBox="0 0 673 633" aria-hidden="true"><use href="/prototype-county.svg#county"/>{{+ meta.dot +}}</svg></span>{{/if}}</div>
    <div class="pf-result-content">
      <p class="pf-result-title">
        <a class="pf-result-link" href="{{ meta.url | default(url) | safeUrl }}">{{ meta.title }}</a>
      </p>
      {{#if meta.line}}<p class="pr-line">{{ meta.line }}</p>{{/if}}
      {{#if excerpt}}<p class="pf-result-excerpt">{{+ excerpt +}}</p>{{/if}}
    </div>
   </div>
  </div>
</li>
</script>`;

// PROTOTYPE (#310): throwaway. The small maps a result may show, as SVG
// strings a Pagefind meta can carry. Built from the helpers, not rendered from
// the components: an id must be unique in the dialog, and the components'
// scoped styles are not on every page.
import {
  outlineBox,
  project,
  runsThrough,
  squareBox,
  type Outline,
} from '#lib/municipalities.js';
import { parkFrame } from '#lib/park-shapes.js';
import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';

const DOT = 0.06;
const r = (n: number) => Math.round(n * 10) / 10;

/** A: the town or Neighborhood, with the Park's dot. */
export function placeSvg(
  shape: Outline,
  villages: Outline[],
  geo: { latitude: number; longitude: number },
  id: string
): string {
  const box = squareBox(outlineBox(shape));
  const clip = `pr-clip-${id}`;
  const dot = project(geo.latitude, geo.longitude);
  const water = [
    runsThrough(shape, GENESEE_RIVER) ? `<path class="water river" clip-path="url(#${clip})" d="${GENESEE_RIVER}"/>` : '',
    runsThrough(shape, ERIE_CANAL) ? `<path class="water" clip-path="url(#${clip})" d="${ERIE_CANAL}"/>` : '',
  ].join('');
  return (
    `<svg viewBox="${r(box.x)} ${r(box.y)} ${r(box.width)} ${r(box.height)}" aria-hidden="true">` +
    `<defs><clipPath id="${clip}"><path d="${shape.paths.join(' ')}"/></clipPath></defs>` +
    `<path class="outline" d="${shape.paths.join(' ')}"/>` +
    villages.map((v) => `<path class="village" clip-path="url(#${clip})" d="${v.paths.join(' ')}"/>`).join('') +
    water +
    `<circle class="dot" cx="${r(dot.x)}" cy="${r(dot.y)}" r="${r(Math.max(box.width, box.height) * DOT)}"/>` +
    `</svg>`
  );
}

/** B: the Park's own land, north up, in a square. */
export function outlineSvg(paths: string[]): string {
  const frame = parkFrame(paths, { square: true });
  return (
    `<svg viewBox="${frame.viewBox}" aria-hidden="true">` +
    paths.map((d) => `<path class="land" d="${d}"/>`).join('') +
    `</svg>`
  );
}

/** D: the dot's place on the one county map every result shares. */
export function countyDot(geo: { latitude: number; longitude: number }): string {
  const dot = project(geo.latitude, geo.longitude);
  return `<circle class="dot" cx="${r(dot.x)}" cy="${r(dot.y)}" r="${r(673 * DOT)}"/>`;
}
