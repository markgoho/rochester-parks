/**
 * Writes the outline of every Park's grounds this script can place, for
 * #173. Run it again when a source layer changes, or a Park's `geo` or
 * `acres` changes:
 *
 *   bun scripts/park-outlines.ts
 *
 * Three sources, tried in order:
 *   1. scripts/park-outline-picks.ts: a hand-picked list of feature ids.
 *   2. The Monroe County Park-boundary layer, by an exact name match: the
 *      county Parks, plus a State Park page and a Trail page the layer also
 *      names.
 *   3. The tax parcel layer under the Park's point (scripts/park-parcels.ts
 *      picks which parcels join): Monroe County's Parcels_Public for a
 *      town, village or state Park, or the City of Rochester's
 *      Tax_Parcels_City_Owned_Land_Open_Data for a city Park. IMPORTANT:
 *      use that City layer, not the plain Tax_Parcels_Open_Data layer:
 *      only this layer carries an owner name (`OWNERNME1`), so a parcel
 *      found in it also confirms City ownership. Its polygon query cannot
 *      take a `distance` (the service errors on the buffer), so the city
 *      adapter's `touching` uses a plain intersects; its point queries
 *      take one fine.
 *
 * Writes docs/park-outlines-report.md alongside src/lib/park-outlines.ts.
 *
 * To measure a rule change against the hand picks (#300), run
 *
 *   MEASURE=1 QUERY_CACHE=<dir> bun scripts/park-outlines.ts
 *
 * It turns `PICKS` off, writes nothing, and prints which picks the search
 * now reproduces and which searched outlines it changes. `QUERY_CACHE`
 * keeps each layer response on disk, so a rerun makes no network calls.
 */
import { createHash } from 'node:crypto';
import {
  existsSync,
  globSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import matter from 'gray-matter';
import polygonClipping from 'polygon-clipping';
import { isParkContainer, isParkType, isTrailType } from '../src/lib/park-types';
import {
  chooseParcels,
  chooseSeed,
  isMiss,
  type ParcelMiss,
  type ParkFacts,
  type Seed,
  type ParcelFeature,
  type ParcelSource,
  type Point,
  type Poly,
  type Ring,
} from './park-parcels';
import { NO_OUTLINE, PICKS, type Pick } from './park-outline-picks';
import type { OutlineSource, ParkOutline } from '../src/lib/types';

const CONTENT_ROOT = new URL('../content', import.meta.url).pathname;
const OUTPUT_URL = new URL('../src/lib/park-outlines.ts', import.meta.url);
const OUTPUT_PATH = OUTPUT_URL.pathname;
const REPORT_PATH = new URL('../docs/park-outlines-report.md', import.meta.url)
  .pathname;

// Each layer's own URL, without `/query`: this is what `source.layer` stores.
// A fetch always adds `/query` itself (see `queryUrl`).
const COUNTY_LAYER =
  'https://maps.monroecounty.gov/server/rest/services/Hosted/County_Park_Boundaries_View/FeatureServer/0';
const PARCELS_LAYER =
  'https://maps.monroecounty.gov/server/rest/services/Hosted/Parcels_Public/FeatureServer/0';
const CITY_LAYER =
  'https://maps.cityofrochester.gov/server/rest/services/Open_Data/Tax_Parcels_City_Owned_Land_Open_Data/FeatureServer/4';
/** With a pick's `way/<id>`, the URL of the way the outline came from. */
const OSM_LAYER = 'https://www.openstreetmap.org';
const CITY_ZONING_LAYER =
  'https://maps.cityofrochester.gov/server/rest/services/Open_Data/Zoning_Districts_Open_Data/FeatureServer/0';

function queryUrl(layer: string): string {
  return `${layer}/query`;
}

/** Tax-parcel classes that mark park land (county and city share the list). */
const PARK_CLASSES = [590, 591, 592, 593, 682, 960, 961, 962, 963];

/**
 * The county layer's own `park` name for each of its 21 named areas, mapped
 * to that area's page: 19 county Parks, one State Park page and one Trail
 * page (a Trail is not a Park — CONTEXT.md, ADR-0006).
 */
const COUNTY_ALIASES: Record<string, string> = {
  'Oatka Creek': '/monroe-county-parks/oatka-creek-park/',
  Seneca: '/monroe-county-parks/seneca-park/',
  Tryon: '/monroe-county-parks/tryon-park/',
  Northampton: '/monroe-county-parks/northampton-park/',
  "Devil's Cove": '/monroe-county-parks/devils-cove-park/',
  'Abraham Lincoln': '/monroe-county-parks/abraham-lincoln-park/',
  'Genesee Valley': '/monroe-county-parks/genesee-valley-park/',
  Highland: '/monroe-county-parks/highland-park/',
  'Powder Mills': '/monroe-county-parks/powder-mills-park/',
  Churchville: '/monroe-county-parks/churchville-park/',
  'Greece Canal': '/monroe-county-parks/greece-canal-park/',
  Webster: '/monroe-county-parks/webster-park/',
  'Lehigh Valley Trail Linear': '/trails/lehigh-valley-trail-linear-park/',
  Ellison: '/monroe-county-parks/ellison-park/',
  'Irondequoit State Marine':
    '/state-parks/irondequoit-bay-state-marine-park/',
  'Black Creek': '/monroe-county-parks/black-creek-park/',
  'Mendon Ponds': '/monroe-county-parks/mendon-ponds-park/',
  'Ontario Beach': '/monroe-county-parks/ontario-beach-park/',
  'Irondequoit Bay West': '/monroe-county-parks/irondequoit-bay-park-west/',
  'Durand-Eastman': '/monroe-county-parks/durand-eastman-park/',
  'Lucien Morin': '/monroe-county-parks/lucien-morin-park/',
};

const MEASURE = process.env.MEASURE === '1';
const QUERY_CACHE = process.env.QUERY_CACHE;

type RawFeature = { properties: Record<string, unknown>; geometry: GeoJsonGeometry };

/** POSTs a query, since the polygon geometry a search sends can be long. */
async function query(
  url: string,
  params: Record<string, string>
): Promise<RawFeature[]> {
  const body = new URLSearchParams({
    outSR: '4326',
    geometryPrecision: '7',
    f: 'geojson',
    outFields: '*',
    ...params,
  });
  if (!QUERY_CACHE) return fetchQuery(url, body);
  const key = createHash('sha256').update(`${url}?${body}`).digest('hex');
  const file = `${QUERY_CACHE}/${key}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const features = await fetchQuery(url, body);
  mkdirSync(QUERY_CACHE, { recursive: true });
  writeFileSync(file, JSON.stringify(features));
  return features;
}

async function fetchQuery(
  url: string,
  body: URLSearchParams
): Promise<RawFeature[]> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, { method: 'POST', body });
    if (response.ok) {
      const json = (await response.json()) as {
        error?: unknown;
        features?: RawFeature[];
      };
      if (!json.error) return json.features ?? [];
      if (attempt > 0) throw new Error(`${url}: ${JSON.stringify(json.error)}`);
    } else if (attempt > 0) {
      throw new Error(`${url}: ${response.status} ${response.statusText}`);
    }
  }
}

interface GeoJsonGeometry {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
}

function polysOf(geometry: GeoJsonGeometry): Poly[] {
  return (
    geometry.type === 'MultiPolygon'
      ? geometry.coordinates
      : [geometry.coordinates]
  ) as Poly[];
}

/** Metres per degree of longitude and latitude, at this latitude. */
function metresPerDegree(latitude: number): { dx: number; dy: number } {
  return { dx: 111320 * Math.cos((latitude * Math.PI) / 180), dy: 111320 };
}

/** Shortest distance from a point to a segment, in metres. */
function segmentDistance(
  point: Point,
  a: Point,
  b: Point,
  m: { dx: number; dy: number }
): number {
  const px = point[0] * m.dx,
    py = point[1] * m.dy;
  const ax = a[0] * m.dx,
    ay = a[1] * m.dy;
  const bx = b[0] * m.dx,
    by = b[1] * m.dy;
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Shortest distance from a point to a feature's nearest edge, in metres. */
function distanceMetres(point: Point, polys: Poly[]): number {
  const m = metresPerDegree(point[1]);
  let min = Infinity;
  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        min = Math.min(min, segmentDistance(point, ring[i], ring[i + 1], m));
      }
    }
  }
  return min;
}

/**
 * A `ParcelSource` over the county's Parcels_Public layer (town, village and
 * state Parks) or the city's Tax_Parcels_City_Owned_Land_Open_Data layer
 * (city Parks). The two layers name their fields differently, and only the
 * county layer carries `swis`.
 */
function makeParcelSource(layer: string, city: boolean): ParcelSource {
  const classWhere = city
    ? `CLASSCD in (${PARK_CLASSES.map((c) => `'${c}'`).join(',')})`
    : `propertyclass in (${PARK_CLASSES.join(',')})`;
  const outFields = city
    ? 'PARCELID,CLASSCD,SHAPEACRES,OWNERNME1,STREET_NUM,STREET_NAME'
    : 'countysbl,swis,acres,propertyclass,propertyclassdescription,parceladdressnumber,parceladdressstreetname';

  function toFeature(raw: {
    properties: Record<string, unknown>;
    geometry: GeoJsonGeometry;
  }): ParcelFeature {
    const p = raw.properties;
    const classCode = Number(city ? p.CLASSCD : p.propertyclass);
    const owner = city ? String(p.OWNERNME1 ?? '').trim() : '';
    const number = String(
      (city ? p.STREET_NUM : p.parceladdressnumber) ?? ''
    ).trim();
    const street = String(
      (city ? p.STREET_NAME : p.parceladdressstreetname) ?? ''
    ).trim();
    return {
      id: String(city ? p.PARCELID : p.countysbl),
      parkType: PARK_CLASSES.includes(classCode),
      classCode,
      swis: city ? undefined : ((p.swis as string) ?? undefined),
      acres: Number(city ? p.SHAPEACRES : p.acres),
      geometry: polysOf(raw.geometry),
      description: city
        ? `class ${p.CLASSCD}`
        : `class ${p.propertyclass} ${p.propertyclassdescription ?? ''}`.trim(),
      owner: owner || undefined,
      address: street ? { number: number || undefined, street } : undefined,
    };
  }

  return {
    // The city layer carries no `swis` at all, so it never applies the
    // same-municipality growth rule (scripts/park-parcels.ts).
    hasSwis: !city,

    async containing(point) {
      const raw = await query(queryUrl(layer), {
        geometry: `${point.longitude},${point.latitude}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        outFields,
      });
      return raw.map(toFeature);
    },

    async near(point, metres) {
      const raw = await query(queryUrl(layer), {
        geometry: `${point.longitude},${point.latitude}`,
        geometryType: 'esriGeometryPoint',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        where: classWhere,
        distance: String(metres),
        units: 'esriSRUnit_Meter',
        outFields,
      });
      const target: Point = [point.longitude, point.latitude];
      return raw
        .map(toFeature)
        .sort(
          (a, b) =>
            distanceMetres(target, a.geometry) -
            distanceMetres(target, b.geometry)
        );
    },

    // Only the City has a zoning layer (#300).
    ...(city
      ? {
          async openSpace(point: { latitude: number; longitude: number }) {
            const raw = await query(queryUrl(CITY_ZONING_LAYER), {
              geometry: `${point.longitude},${point.latitude}`,
              geometryType: 'esriGeometryPoint',
              inSR: '4326',
              spatialRel: 'esriSpatialRelIntersects',
              outFields: 'LABEL',
              returnGeometry: 'false',
            });
            return raw.some((f) => f.properties.LABEL === 'O-S');
          },
        }
      : {}),

    // The city layer's polygon query fails with a `distance` (server error
    // during the buffer operation), so only the county layer asks for one.
    async touching(features) {
      const union = polygonClipping.union(
        ...features.flatMap((f) => f.geometry)
      );
      const esriGeometry = {
        rings: union.flat(),
        spatialReference: { wkid: 4326 },
      };
      const params: Record<string, string> = {
        geometry: JSON.stringify(esriGeometry),
        geometryType: 'esriGeometryPolygon',
        inSR: '4326',
        spatialRel: 'esriSpatialRelIntersects',
        where: classWhere,
        outFields,
      };
      if (!city) {
        params.distance = '1';
        params.units = 'esriSRUnit_Meter';
      }
      const raw = await query(queryUrl(layer), params);
      return raw.map(toFeature);
    },
  };
}

interface PageRecord {
  url: string;
  title: string | undefined;
  address: string | undefined;
  type: string | undefined;
  former: boolean;
  acres: number | undefined;
  geo: { latitude: number; longitude: number } | undefined;
}

/** A path relative to `content/`, turned into a page URL, like `urlFor`. */
function urlFor(file: string): string {
  return file
    .slice(CONTENT_ROOT.length)
    .replace(/(_index|index)\.md$/, '')
    .replace(/\.md$/, '/');
}

function loadPages(): PageRecord[] {
  return globSync(`${CONTENT_ROOT}/**/*.md`)
    .sort()
    .map((file) => {
      const { data } = matter(readFileSync(file, 'utf8'));
      const front = data as {
        title?: string;
        address?: { streetAddress?: string };
        type?: string;
        former?: boolean;
        acres?: number;
        geo?: { latitude?: number; longitude?: number };
      };
      const geo =
        front.geo?.latitude !== undefined && front.geo?.longitude !== undefined
          ? { latitude: front.geo.latitude, longitude: front.geo.longitude }
          : undefined;
      return {
        url: urlFor(file),
        title: front.title,
        address: front.address?.streetAddress,
        type: front.type,
        former: front.former === true,
        acres: front.acres,
        geo,
      };
    });
}

function parentUrl(url: string): string {
  const segments = url.split('/').filter(Boolean);
  return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}/`;
}

function isCityPark(page: PageRecord): boolean {
  return page.url.startsWith('/rochester-city-parks/');
}

/** Same rule as `content.ts`'s `isPark`: a Park hangs directly off a container. */
function isParkPage(page: PageRecord): boolean {
  if (!isParkType(page.type)) return false;
  if (isParkContainer(page.url)) return false;
  return isParkContainer(parentUrl(page.url));
}

type Section = 'county' | 'town and village' | 'city' | 'state' | 'trail';

function sectionOf(url: string): Section {
  if (url.startsWith('/monroe-county-parks/')) return 'county';
  if (url.startsWith('/town-parks/')) return 'town and village';
  if (url.startsWith('/rochester-city-parks/')) return 'city';
  if (url.startsWith('/state-parks/')) return 'state';
  if (url.startsWith('/trails/')) return 'trail';
  throw new Error(`sectionOf: unrecognised page url ${url}`);
}

interface CountyPark {
  ids: string[];
  polys: Poly[];
}

/** Fetches the whole county Park-boundary layer once, grouped by its `park` name. */
async function loadCountyParks(): Promise<Map<string, CountyPark>> {
  const raw = await query(queryUrl(COUNTY_LAYER), { where: '1=1' });
  const byName = new Map<string, { id: string; polys: Poly[] }[]>();
  for (const f of raw) {
    const name = String(f.properties.park);
    const list = byName.get(name) ?? [];
    list.push({ id: String(f.properties.objectid), polys: polysOf(f.geometry) });
    byName.set(name, list);
  }
  const parks = new Map<string, CountyPark>();
  for (const [name, list] of byName) {
    const sorted = list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    parks.set(name, {
      ids: sorted.map((f) => f.id),
      polys: sorted.flatMap((f) => f.polys),
    });
  }
  return parks;
}

type PickLayer = 'county parks' | 'county parcels' | 'city parcels';

function pickLayer(kind: Pick['layer']): string {
  return kind === 'openstreetmap'
    ? OSM_LAYER
    : kind === 'county parks'
      ? COUNTY_LAYER
      : kind === 'county parcels'
        ? PARCELS_LAYER
        : CITY_LAYER;
}

/** Fetches a hand-picked list of feature ids straight from their layer. */
async function fetchByIds(
  kind: PickLayer,
  ids: string[]
): Promise<{ layer: string; polys: Poly[] }> {
  const layer = pickLayer(kind);
  const idField =
    kind === 'county parks'
      ? 'objectid'
      : kind === 'county parcels'
        ? 'countysbl'
        : 'PARCELID';
  const where =
    kind === 'county parks'
      ? `objectid in (${ids.join(',')})`
      : `${idField} in (${ids.map((id) => `'${id}'`).join(',')})`;
  const raw = await query(queryUrl(layer), { where });
  const byId = new Map(
    raw.map((f) => [String(f.properties[idField]), polysOf(f.geometry)])
  );
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length > 0) {
    throw new Error(`${kind}: picked id(s) not found: ${missing.join(', ')}`);
  }
  return { layer, polys: [...ids].sort().flatMap((id) => byId.get(id) ?? []) };
}

/** How far, in degrees of latitude, a simplified edge may stray from the source. */
const SIMPLIFY_TOLERANCE = 0.00001; // about 1.1 m

/** Douglas–Peucker on longitude scaled by cos(latitude), so both axes are metres. */
function simplifyRing(points: Ring, k: number): Ring {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot((bx - ax) * k, by - ay);
  let far = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i];
    const distance =
      length === 0
        ? Math.hypot((px - ax) * k, py - ay)
        : Math.abs((bx - ax) * k * (ay - py) - (ax - px) * k * (by - ay)) /
          length;
    if (distance > far) {
      far = distance;
      index = i;
    }
  }
  if (far <= SIMPLIFY_TOLERANCE) return [points[0], points[points.length - 1]];
  return [
    ...simplifyRing(points.slice(0, index + 1), k).slice(0, -1),
    ...simplifyRing(points.slice(index), k),
  ];
}

/**
 * Simplifies a union of polygons around one Park's own latitude, to 6
 * decimal places. Drops a hole under 4 points; drops the whole polygon when
 * its outer ring collapses under 4 points, even if a hole survives.
 */
function simplifyPolygons(polys: Poly[], latitude: number): Poly[] {
  const k = Math.cos((latitude * Math.PI) / 180);
  const round = (ring: Ring): Ring =>
    ring.map(([x, y]) => [Number(x.toFixed(6)), Number(y.toFixed(6))]);
  const result: Poly[] = [];
  for (const [outer, ...holes] of polys) {
    const simpleOuter = simplifyRing(outer, k);
    // An outer ring this small only happens when the whole polygon is a
    // sliver under a metre or two across (a sub-metre parcel artifact);
    // dropping it loses nothing worth keeping.
    if (simpleOuter.length < 4) continue;
    const simpleHoles = holes
      .map((ring) => simplifyRing(ring, k))
      .filter((ring) => ring.length >= 4);
    result.push([round(simpleOuter), ...simpleHoles.map(round)]);
  }
  return result;
}

interface Resolved {
  url: string;
  section: Section;
  polys: Poly[];
  ids: string[];
  layer: string;
  picked: boolean;
  /** The seed parcel sat near the point, not under it: `geo` may be off. */
  viaNear: boolean;
  /** A pick cut to its `clip` area, so it may share parcels on purpose. */
  clipped?: boolean;
}

interface Missed {
  url: string;
  section: Section;
  reason: string;
  pageAcres?: number;
  evidence?: ParcelFeature;
  joinedIds?: string[];
  joinedAcres?: number;
  /** Why a person decided this Park has no outline (NO_OUTLINE). */
  decided?: string;
}

async function resolvePage(
  page: PageRecord,
  countyParks: Map<string, CountyPark>,
  countyNameByUrl: Map<string, string>,
  parcelSource: ParcelSource,
  citySource: ParcelSource,
  picks: Record<string, Pick>,
  claimed: Map<string, string>,
  seeds: Map<string, Seed | ParcelMiss>
): Promise<Resolved | Missed> {
  const section = sectionOf(page.url);

  const decided = NO_OUTLINE[page.url];
  if (decided) {
    return {
      url: page.url,
      section,
      reason: 'no outline, by decision',
      pageAcres: page.acres,
      decided,
    };
  }

  const pick = picks[page.url];
  if (pick?.layer === 'openstreetmap') {
    return {
      url: page.url,
      section,
      polys: pick.rings.map((ring) => [ring]),
      ids: [...pick.ids].sort(),
      layer: OSM_LAYER,
      picked: true,
      viaNear: false,
    };
  }
  if (pick) {
    const { layer, polys } = await fetchByIds(pick.layer, pick.ids);
    return {
      url: page.url,
      section,
      polys: pick.clip
        ? polygonClipping.intersection(polygonClipping.union(...polys), [
            [pick.clip],
          ])
        : polys,
      ids: [...pick.ids].sort(),
      layer,
      picked: true,
      viaNear: false,
      clipped: pick.clip !== undefined,
    };
  }

  const countyName = countyNameByUrl.get(page.url);
  if (countyName) {
    const entry = countyParks.get(countyName);
    if (!entry) {
      throw new Error(`county layer has no "${countyName}" for ${page.url}`);
    }
    return {
      url: page.url,
      section,
      polys: entry.polys,
      ids: entry.ids,
      layer: COUNTY_LAYER,
      picked: false,
      viaNear: false,
    };
  }

  if (!page.geo) {
    return { url: page.url, section, reason: 'no geo point on the page' };
  }

  const city = isCityPark(page);
  const othersIds = new Set(
    [...claimed].filter(([, url]) => url !== page.url).map(([id]) => id)
  );
  const choice = await chooseParcels(
    factsOf(page, page.geo),
    city ? citySource : parcelSource,
    othersIds,
    seeds.get(page.url)
  );
  if (isMiss(choice)) {
    return {
      url: page.url,
      section,
      reason: choice.reason,
      pageAcres: page.acres,
      evidence: choice.evidence,
      joinedIds: choice.ids,
      joinedAcres: choice.acres,
    };
  }
  return {
    url: page.url,
    section,
    polys: choice.geometry,
    ids: choice.ids,
    layer: city ? CITY_LAYER : PARCELS_LAYER,
    picked: false,
    viaNear: choice.via === 'near',
  };
}

function factsOf(
  page: PageRecord,
  geo: { latitude: number; longitude: number }
): ParkFacts {
  return {
    ...geo,
    acres: page.acres,
    address: page.address,
    name: page.title,
  };
}

/** Runs `fn` over `items` with at most `limit` calls in flight at once. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker)
  );
  return results;
}

/**
 * One polygon per line, so a diff shows which Park changed rather than
 * rewriting every coordinate onto its own line the way `JSON.stringify(x,
 * null, 2)` would.
 */
function outlineLiteral(url: string, outline: ParkOutline): string {
  const polyLines = outline.polygons
    .map((poly) => `      ${JSON.stringify(poly)}`)
    .join(',\n');
  const ids = outline.source.ids.map((id) => JSON.stringify(id)).join(', ');
  const picked = outline.source.picked ? '\n      picked: true,' : '';
  return `  ${JSON.stringify(url)}: {
    polygons: [
${polyLines}
    ],
    source: {
      layer: ${JSON.stringify(outline.source.layer)},
      ids: [${ids}],
      fetched: ${JSON.stringify(outline.source.fetched)},${picked}
    },
  },`;
}

function writeOutput(outlines: Record<string, ParkOutline>): void {
  const urls = Object.keys(outlines).sort();
  const body = urls.map((url) => outlineLiteral(url, outlines[url])).join('\n');
  writeFileSync(
    OUTPUT_PATH,
    `// Generated by scripts/park-outlines.ts from the Monroe County and City
// of Rochester GIS layers (#173). Do not edit by hand.
import type { ParkOutline } from './types';

export const PARK_OUTLINES: Record<string, ParkOutline> = {
${body}
};
`
  );
}

function evidenceLine(evidence: ParcelFeature | undefined): string {
  if (!evidence) return 'nothing found under the point';
  const parts = [
    evidence.description ?? 'unknown class',
    `${evidence.acres.toFixed(2)} ac`,
  ];
  if (evidence.owner) parts.push(`owner: ${evidence.owner}`);
  return parts.join(', ');
}

/** Even-odd ray cast, so a point in a hole counts as outside. */
function insidePolys(point: Point, polys: Poly[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (const rings of polys) {
    for (const ring of rings) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
    }
  }
  return inside;
}

function writeReport(
  targets: PageRecord[],
  resolved: Resolved[],
  missed: Missed[]
): void {
  const lines: string[] = ['# Park outlines report', ''];
  lines.push(
    '_Generated by `scripts/park-outlines.ts` (#173). Do not edit by hand._',
    ''
  );

  const sections: Section[] = ['county', 'town and village', 'city', 'state'];
  lines.push('## Counts', '');
  let combinedFound = 0;
  let combinedTotal = 0;
  for (const section of sections) {
    const total = targets.filter((p) => sectionOf(p.url) === section).length;
    const found = resolved.filter((r) => r.section === section).length;
    const pct = total === 0 ? 0 : Math.round((100 * found) / total);
    lines.push(`- ${section}: ${found} of ${total} (${pct}%)`);
    if (section !== 'county' && section !== 'state') {
      combinedFound += found;
      combinedTotal += total;
    }
  }
  const combinedPct =
    combinedTotal === 0 ? 0 : Math.round((100 * combinedFound) / combinedTotal);
  lines.push(
    `- town, village and city combined: ${combinedFound} of ${combinedTotal} (${combinedPct}%), against the issue's >50% target`
  );
  const trailFound = resolved.filter((r) => r.section === 'trail').length;
  const trailTotal = targets.filter((p) => sectionOf(p.url) === 'trail').length;
  if (trailTotal > 0) {
    lines.push(`- trail (via the county layer): ${trailFound} of ${trailTotal}`);
  }
  lines.push('');

  lines.push('## Parks with no outline', '');
  const byReason = new Map<string, Missed[]>();
  for (const miss of missed) {
    const list = byReason.get(miss.reason) ?? [];
    list.push(miss);
    byReason.set(miss.reason, list);
  }
  for (const reason of [...byReason.keys()].sort()) {
    const list = byReason.get(reason)!.sort((a, b) => a.url.localeCompare(b.url));
    lines.push(`### ${reason} (${list.length})`, '');
    for (const miss of list) {
      const acres = miss.pageAcres !== undefined ? `${miss.pageAcres} ac` : 'no acres on the page';
      // The acres check runs on parcels already joined, so its evidence is
      // the joined total, not "what the point falls on" (that check never ran).
      const detail = miss.decided
        ? miss.decided
        : miss.joinedAcres !== undefined
          ? `joined parcels ${miss.joinedAcres.toFixed(2)} ac (${(miss.joinedIds ?? []).join(', ')})`
          : evidenceLine(miss.evidence);
      lines.push(`- ${miss.url} — page acres ${acres} — ${detail}`);
    }
    lines.push('');
  }

  lines.push('## Parks placed from a nearby parcel, not one under the point', '');
  lines.push(
    "_The Park's `geo` point may be off. This script does not edit `geo`._",
    ''
  );
  for (const r of resolved
    .filter((r) => r.viaNear)
    .sort((a, b) => a.url.localeCompare(b.url))) {
    lines.push(`- ${r.url}`);
  }
  lines.push('');

  // Two Parks on one parcel is almost always a mistake: two pages for one
  // place, or one Park's search that grew into another's land (#292).
  const byParcel = new Map<string, string[]>();
  for (const r of resolved) {
    for (const id of r.ids) {
      const key = `${r.layer} ${id}`;
      byParcel.set(key, [...(byParcel.get(key) ?? []), r.url]);
    }
  }
  // Clipped picks cut one parcel between Parks, so they share it on purpose.
  const clipped = new Set(resolved.filter((r) => r.clipped).map((r) => r.url));
  const shared = [...byParcel]
    .filter(([, urls]) => urls.length > 1 && !urls.every((u) => clipped.has(u)))
    .sort(([a], [b]) => a.localeCompare(b));
  lines.push('## Parcels in more than one outline', '');
  if (shared.length === 0) lines.push('_None._');
  for (const [key, urls] of shared) {
    lines.push(`- ${key.split(' ').pop()}: ${urls.sort().join(', ')}`);
  }
  lines.push('');

  // A point outside its own outline puts the Park's map pin in the wrong place.
  const geoByUrl = new Map(targets.map((p) => [p.url, p.geo]));
  const outside = resolved
    .filter((r) => {
      const geo = geoByUrl.get(r.url);
      return geo && !insidePolys([geo.longitude, geo.latitude], r.polys);
    })
    .map((r) => r.url)
    .sort();
  lines.push("## Parks whose `geo` point is outside their outline", '');
  lines.push(
    '_Some are right: a lock or a parking lot on land with no tax parcel. Move the others._',
    ''
  );
  if (outside.length === 0) lines.push('_None._');
  for (const url of outside) lines.push(`- ${url}`);
  lines.push('');

  writeFileSync(REPORT_PATH, lines.join('\n'));
}

/**
 * Prints how the search, with `PICKS` off, compares with each pick and with
 * each outline the search draws now (#300). A pick is reproduced only when
 * the layer and every id match; a searched outline must not change.
 */
function printMeasure(
  outcomes: (Resolved | Missed)[],
  previous: Record<string, ParkOutline>
): void {
  const key = (layer: string, ids: string[]) =>
    `${layer} ${[...ids].sort().join(',')}`;
  const picked: Record<string, string[]> = {};
  const searched: string[] = [];
  for (const outcome of outcomes) {
    const got = 'polys' in outcome ? outcome : undefined;
    const gotKey = got ? key(got.layer, got.ids) : 'none';
    const gotLine = got
      ? `${got.ids.length} parcel(s): ${got.ids.join(', ')}`
      : `miss: ${(outcome as Missed).reason}`;
    const pick = PICKS[outcome.url];
    if (pick) {
      const wanted = key(pickLayer(pick.layer), pick.ids);
      let verdict: string;
      if (!got) verdict = 'missed';
      else if (pick.layer !== 'openstreetmap' && pick.clip) verdict = 'needs a clip';
      else if (gotKey === wanted) verdict = 'reproduced';
      else if (got.layer !== pickLayer(pick.layer)) verdict = 'other layer';
      else if (pick.ids.every((id) => got.ids.includes(id))) verdict = 'too many';
      else if (got.ids.every((id) => pick.ids.includes(id))) verdict = 'too few';
      else verdict = 'different';
      (picked[verdict] ??= []).push(
        verdict === 'reproduced'
          ? outcome.url
          : `${outcome.url}\n    want ${pick.ids.join(', ')}\n    got  ${gotLine}`
      );
      continue;
    }
    const prior = previous[outcome.url];
    const priorKey = prior ? key(prior.source.layer, prior.source.ids) : 'none';
    if (prior?.source.picked || gotKey === priorKey) continue;
    searched.push(
      `${outcome.url}\n    was ${prior ? prior.source.ids.join(', ') : 'none'}\n    now ${gotLine}`
    );
  }
  const total = Object.values(picked).reduce((n, list) => n + list.length, 0);
  console.log(`Picks reproduced: ${picked.reproduced?.length ?? 0} of ${total}`);
  for (const [verdict, list] of Object.entries(picked).sort()) {
    console.log(`\n## ${verdict} (${list.length})`);
    for (const line of list.sort()) console.log(`- ${line}`);
  }
  console.log(`\n## searched outlines changed (${searched.length})`);
  for (const line of searched.sort()) console.log(`- ${line}`);
}

async function main(): Promise<void> {
  const pages = loadPages();
  const pageUrls = new Set(pages.map((p) => p.url));

  const countyParks = await loadCountyParks();
  const layerNames = new Set(countyParks.keys());
  const aliasNames = new Set(Object.keys(COUNTY_ALIASES));
  const noAlias = [...layerNames].filter((n) => !aliasNames.has(n));
  const noLayer = [...aliasNames].filter((n) => !layerNames.has(n));
  if (noAlias.length > 0 || noLayer.length > 0) {
    throw new Error(
      `COUNTY_ALIASES is out of date. Layer names with no alias: ` +
        `${noAlias.join(', ') || 'none'}. Aliases with no layer name: ` +
        `${noLayer.join(', ') || 'none'}.`
    );
  }

  const countyNameByUrl = new Map<string, string>();
  for (const [name, url] of Object.entries(COUNTY_ALIASES)) {
    if (!pageUrls.has(url)) {
      throw new Error(`COUNTY_ALIASES: no page at ${url} (for "${name}")`);
    }
    countyNameByUrl.set(url, name);
  }

  const targets = pages.filter(
    (p) =>
      (isParkPage(p) && !p.former) ||
      (isTrailType(p.type) && countyNameByUrl.has(p.url))
  );

  const targetUrls = new Set(targets.map((p) => p.url));
  for (const url of Object.keys(PICKS)) {
    if (!targetUrls.has(url)) {
      throw new Error(`PICKS: "${url}" is not a target page`);
    }
  }
  for (const url of Object.keys(NO_OUTLINE)) {
    if (!targetUrls.has(url)) {
      throw new Error(`NO_OUTLINE: "${url}" is not a target page`);
    }
    if (PICKS[url]) {
      throw new Error(`"${url}" is in both PICKS and NO_OUTLINE`);
    }
  }

  const parcelSource = makeParcelSource(PARCELS_LAYER, false);
  const citySource = makeParcelSource(CITY_LAYER, true);

  const picks: Record<string, Pick> = MEASURE ? {} : PICKS;

  // Growth never takes another Park's parcel: a picked Park's ids, or the
  // seed of a Park the search will place (#300). Key: parcel id, value: the
  // Park's URL.
  const claimed = new Map<string, string>();
  for (const [url, pick] of Object.entries(picks)) {
    if (pick.layer !== 'county parks' && pick.layer !== 'openstreetmap') {
      for (const id of pick.ids) claimed.set(id, url);
    }
  }
  // Every Park `resolvePage` sends to the parcel search.
  const searched = targets.filter(
    (p) =>
      p.geo !== undefined &&
      !picks[p.url] &&
      !NO_OUTLINE[p.url] &&
      !countyNameByUrl.has(p.url)
  );
  const seeds = new Map<string, Seed | ParcelMiss>();
  await mapWithConcurrency(searched, 8, async (page) => {
    const seed = await chooseSeed(
      factsOf(page, page.geo!),
      isCityPark(page) ? citySource : parcelSource
    );
    seeds.set(page.url, seed);
    if (!isMiss(seed)) claimed.set(seed.feature.id, page.url);
  });

  const outcomes = await mapWithConcurrency(targets, 8, (page) =>
    resolvePage(
      page,
      countyParks,
      countyNameByUrl,
      parcelSource,
      citySource,
      picks,
      claimed,
      seeds
    )
  );
  const resolved = outcomes.filter((o): o is Resolved => 'polys' in o);
  const missed = outcomes.filter((o): o is Missed => 'reason' in o);

  const previous: Record<string, ParkOutline> = existsSync(OUTPUT_PATH)
    ? ((await import(OUTPUT_URL.href)) as { PARK_OUTLINES: Record<string, ParkOutline> })
        .PARK_OUTLINES
    : {};

  if (MEASURE) {
    printMeasure(outcomes, previous);
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const outlines: Record<string, ParkOutline> = {};
  const byUrl = new Map(targets.map((p) => [p.url, p]));
  for (const r of resolved) {
    const page = byUrl.get(r.url)!;
    const latitude = page.geo?.latitude ?? r.polys[0]?.[0]?.[0]?.[1] ?? 0;
    const polygons = simplifyPolygons(
      polygonClipping.union(...r.polys),
      latitude
    );
    const prior = previous[r.url];
    const samePrior =
      prior !== undefined &&
      JSON.stringify(prior.source.ids) === JSON.stringify(r.ids) &&
      JSON.stringify(prior.polygons) === JSON.stringify(polygons);
    const source: OutlineSource = {
      layer: r.layer,
      ids: r.ids,
      fetched: samePrior ? prior.source.fetched : today,
      ...(r.picked ? { picked: true } : {}),
    };
    outlines[r.url] = { polygons, source };
  }

  writeOutput(outlines);
  writeReport(targets, resolved, missed);

  console.log(
    `${resolved.length} of ${targets.length} Parks placed, ${missed.length} missed.`
  );
}

main();
