import { formatAcres } from './format.js';
import {
  isCitySection,
  isCountySection,
  isStateSection,
  municipality,
  placeAt,
  townAt,
  townKey,
} from './municipalities.js';
import { neighborhoodAt } from './neighborhoods.js';
import { parkShapeSvg, placeMapSvg } from './search-map.js';
import type { Page, ParkMeta } from './types.js';

/**
 * What a page contributes to the Pagefind index (#320): whether it belongs
 * there at all, the title a result shows for it, and the second line under
 * that title. `title` matches the page's own `h1`, which Pagefind already
 * reads as the result title on its own; a layout only needs to render it as
 * a `data-pagefind-meta="title"` override where the two differ (the
 * "Trails" sub-page).
 */
export interface SearchEntry {
  indexed: boolean;
  title: string;
  /** The mono second line under the title. Absent when a kind has none. */
  line?: string;
  /**
   * The town or Neighborhood name alone, kept as ordinary indexed text with
   * no extra weight (#297): "Greece" and "19th Ward" find the Parks there
   * even though the rail that shows it, and the second line above, are both
   * `data-pagefind-ignore`.
   */
  place?: string;
  /**
   * The result's photo (#341): the same one its card shows, site-relative
   * or absolute. Carried as a `photo` meta value, not Pagefind's own
   * `image`, which it fills on its own from the first image in the body.
   */
  photo?: string;
  /**
   * The result's picture when it has no photo (#341): an SVG file's text,
   * the Park's own outline where it has one, else its place map (#310,
   * #323), the town or Neighborhood with the Park's dot. Served at the
   * page's own `map.svg` (#333); a layout puts only a `map` flag in the
   * page, since Pagefind indexes every meta value. Absent when the Park has
   * a photo, and where it has neither an outline nor a place map.
   */
  map?: string;
}

const NOT_INDEXED = (title: string): SearchEntry => ({ indexed: false, title });

/**
 * A Park's or Trail's result picture (#341), in its card's order: its
 * photo, else its own outline, else its place map.
 */
function pictureOf(
  meta: ParkMeta,
  isTrail: boolean,
  outline: string[] | undefined
): Pick<SearchEntry, 'photo' | 'map'> {
  if (meta.photo) return { photo: meta.photo };
  return {
    map: outline ? parkShapeSvg(outline) : placeMapSvg(meta, isTrail),
  };
}

/**
 * The town or Neighborhood a Park's point falls in, on its own (#297): the
 * word every result's second line also carries, but the line itself is
 * `data-pagefind-ignore`, so a layout renders this separately, as ordinary
 * indexed text, for "Greece" and "19th Ward" to match on.
 */
export function parkPlace(park: ParkMeta): string | undefined {
  if (isCitySection(park.section.url)) {
    const n = park.geo && neighborhoodAt(park.geo.latitude, park.geo.longitude);
    // A city Park outside every drawn Neighborhood still names the city, the
    // way the Park page's own facts panel falls back for it.
    return n ? `${n.name}, Rochester` : 'Rochester';
  }
  if (isCountySection(park.section.url) || isStateSection(park.section.url)) {
    const key = park.geo && placeAt(park.geo.latitude, park.geo.longitude);
    return key ? municipality(key)?.label.text : undefined;
  }
  // A town Park: the point decides it, the same way the Park page draws it
  // (Belmanor Park is filed under Brighton and stands in Henrietta); the
  // section's own town is the fallback when the point lands nowhere.
  const key =
    (park.geo && townAt(park.geo.latitude, park.geo.longitude)) ??
    townKey(park.section.url);
  return key ? municipality(key)?.label.text : undefined;
}

/** Who runs the Park, when the second line names an owner beside its place. */
function ownerOf(park: ParkMeta): string | undefined {
  if (isCountySection(park.section.url)) return 'Monroe County';
  if (isStateSection(park.section.url)) return 'New York State';
  return undefined;
}

/**
 * A Park's second line (#320, decided in #297/#298/#310): its place, its
 * owner when the owner is the county or the state, and its acreage when
 * known. A Planned Park says "Planned" instead of an acreage, since it
 * carries none of the free-and-open facts a Park normally does (ADR-0006).
 */
export function parkLine(park: ParkMeta): string | undefined {
  const place = parkPlace(park);
  const owner = ownerOf(park);
  const parts = park.planned
    ? ['Planned', place, owner]
    : [
        place,
        owner,
        park.acres !== undefined
          ? `${formatAcres(park.acres)} acres`
          : undefined,
      ];
  const line = parts
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  return line || undefined;
}

/** A Trail's second line: what it is, and its acreage when known. */
export function trailLine(trail: ParkMeta): string {
  return trail.acres !== undefined
    ? `Trail · ${formatAcres(trail.acres)} acres`
    : 'Trail';
}

/**
 * The search entry for one page (#320). One pure function, so a layout only
 * puts its output into the page rather than re-deciding what belongs in the
 * index or how a result reads.
 */
export function searchEntryOf(page: Page): SearchEntry {
  switch (page.layout) {
    case 'park-single':
      // A Former Park stays out (CONTEXT.md, ADR-0010); a Planned Park is
      // still a Park page, so it is in (`parkLine` says "Planned" for it).
      if (!page.park || page.park.former) return NOT_INDEXED(page.title);
      return {
        indexed: true,
        title: page.title,
        line: parkLine(page.park),
        place: parkPlace(page.park),
        ...pictureOf(page.park, false, page.outline),
      };

    case 'trail-single':
      if (!page.trail) return NOT_INDEXED(page.title);
      return {
        indexed: true,
        title: page.title,
        line: trailLine(page.trail),
        place: parkPlace(page.trail),
        ...pictureOf(page.trail, true, page.outline),
      };

    case 'park-list':
      // The main list of a town, the county, the city or the state. A second
      // ordering (by size, by neighborhood) or a table view carries a
      // `canonical` link back to this page, so it is left out: a Park's row
      // would otherwise be a result again for its own duplicate (#320).
      if (page.canonical !== undefined) return NOT_INDEXED(page.title);
      return { indexed: true, title: page.title, line: 'Park List' };

    case 'default-single':
      // A "Trails" sub-page of a Park (ADR-0007 predates the two of them):
      // titled after the Park, with the Park's own line.
      if (page.trailsOf) {
        return {
          indexed: true,
          title: `Trails, ${page.trailsOf.title}`,
          line: parkLine(page.trailsOf.park),
          place: parkPlace(page.trailsOf.park),
          ...pictureOf(page.trailsOf.park, false, page.trailsOf.outline),
        };
      }
      if (page.url.startsWith('/blog/')) {
        return { indexed: true, title: page.title, line: 'Blog post' };
      }
      // About, and every other stray page this layout covers.
      return { indexed: true, title: page.title };

    default:
      // home, default-list: never in the index (#297).
      return NOT_INDEXED(page.title);
  }
}
