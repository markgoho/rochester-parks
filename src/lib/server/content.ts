import matter from 'gray-matter';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedSmartypants } from 'marked-smartypants';
import {
  buildDate,
  facilitiesJsonLd,
  formatDate,
  hoursJsonLd,
  hoursView,
  isTime,
} from '#lib/hours.js';
import { normaliseAmenity } from '#lib/amenities.js';
import { isCitySection } from '#lib/municipalities.js';
import { SITE_TITLE, absUrl } from '#lib/site.js';
import type {
  ChildLink,
  Facility,
  Holiday,
  Layout,
  OpeningHours,
  Page,
  PageLink,
  ParkIndex,
  ParkAddress,
  ParkIndexEntry,
  ParkLink,
  ParkHours,
  ParkMeta,
  SiteSummary,
} from '#lib/types.js';

// Loads content/**/*.md with Hugo's page model: `_index.md` is a section,
// `index.md` and `foo.md` are pages, and top-level folders without an
// `_index.md` become auto sections.

interface FrontMatter {
  title?: string;
  description?: string;
  type?: string;
  address?: Record<string, string>;
  geo?: { latitude?: number; longitude?: number };
  image?: string;
  sameAs?: string[];
  openingHours?: OpeningHours[];
  closedOn?: Holiday[];
  facilities?: Facility[];
  hoursCheckedOn?: string;
  telephone?: string;
  amenities?: string[];
  /** Park size in acres. ADR-0003 ranks the sources. */
  acres?: number;
}

interface Node extends PageLink {
  kind: 'home' | 'section' | 'page';
  frontMatter: FrontMatter;
  html: string;
  /** Body words, excluding embeds and image syntax. */
  wordCount: number;
  photoCount: number;
  /** The src of the first body image, as written. */
  photo?: string;
}

/** Below this, a park page is a listing rather than a write-up. */
export const WRITTEN_WORD_FLOOR = 150;

/**
 * Words a reader would actually read: map embeds, virtual tours and image
 * syntax are markup, not writing, so they do not count towards the floor.
 */
function bodyWords(markdown: string): number {
  const prose = markdown
    .replace(/<[^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#*_>`|]/g, ' ');
  return prose.split(/\s+/).filter(Boolean).length;
}

function photoCount(markdown: string): number {
  return markdown.match(/!\[[^\]]*\]\([^)]*\)/g)?.length ?? 0;
}

/** The src of the first image in the body, as written in the markdown. */
function firstPhotoSrc(markdown: string): string | undefined {
  const match = markdown.match(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?/);
  return match?.[1];
}

const files = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Every image the site actually ships. A park page can name a picture that
// was never carried over, and a structured-data image that 404s is worse
// than none, so a src is only used once it is found here.
const assets = new Set(
  Object.keys(
    import.meta.glob('/static/**/*.{jpg,jpeg,JPG,JPEG,png,PNG,gif,webp,avif}')
  ).map((file) => file.replace(/^\/static/, ''))
);

/**
 * A body image is written either site-absolute or bare, and a bare src is
 * relative to the park's own URL, the way a Hugo page resource is. Returns
 * an absolute URL, and only when the file exists.
 */
function resolveImage(src: string, pageUrl: string): string | undefined {
  if (/^https?:\/\//.test(src)) return src;
  const path = src.startsWith('/') ? src : `${pageUrl}${src}`;
  return assets.has(decodeURI(path)) ? absUrl(path) : undefined;
}

/**
 * PROTOTYPE (park cards): the picture a card shows for a park. A WordPress
 * featured image or thumbnail in the park's folder comes first, then the
 * first body image, then any image in the folder. A site-relative path.
 */
function cardPhoto(node: Node): string | undefined {
  const inFolder = [...assets].filter((a) => a.startsWith(node.url));
  const featured = inFolder.find((a) => /featured|thumb/i.test(a));
  if (featured) return encodeURI(featured);
  if (node.photo) {
    if (/^https?:\/\//.test(node.photo)) return node.photo;
    const path = node.photo.startsWith('/')
      ? node.photo
      : `${node.url}${node.photo}`;
    if (assets.has(decodeURI(path))) return path;
  }
  return inFolder[0] && encodeURI(inFolder[0]);
}

// Heading ids and typographer, like Hugo. Raw HTML passes through, so pages
// can embed maps and virtual tours.
const markdown = new Marked(gfmHeadingId(), markedSmartypants());

function urlFor(file: string): string {
  const path = file.replace(/^\/content/, '');
  return path.replace(/(_index|index)\.md$/, '').replace(/\.md$/, '/');
}

function titleCase(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/**
 * Hugo titles an untitled page after its slug. Some files carry no front
 * matter at all, and without this they render with an empty heading.
 */
function titleFromUrl(url: string): string {
  const slug = url.split('/').filter(Boolean).pop() ?? '';
  return slug.split('-').map(titleCase).join(' ');
}

function buildNodes(): Map<string, Node> {
  const nodes = new Map<string, Node>();
  const add = (
    node: Omit<Node, 'frontMatter' | 'html' | 'wordCount' | 'photoCount'> &
      Partial<Node>
  ) =>
    nodes.set(node.url, {
      frontMatter: {},
      html: '',
      wordCount: 0,
      photoCount: 0,
      ...node,
    });

  add({ url: '/', title: SITE_TITLE, kind: 'home' });
  add({ url: '/categories/', title: 'Categories', kind: 'section' });
  add({ url: '/tags/', title: 'Tags', kind: 'section' });

  for (const [file, raw] of Object.entries(files)) {
    const { data, content } = matter(raw);
    const frontMatter = data as FrontMatter;
    const url = urlFor(file);
    const isHome = url === '/';
    add({
      url,
      title: frontMatter.title ?? (isHome ? SITE_TITLE : titleFromUrl(url)),
      kind: isHome ? 'home' : file.endsWith('/_index.md') ? 'section' : 'page',
      frontMatter,
      html: markdown.parse(content) as string,
      wordCount: bodyWords(content),
      photoCount: photoCount(content),
      photo: firstPhotoSrc(content),
    });

    // Hugo names an auto section after its folder, in plural form.
    const top = url.split('/')[1];
    if (top && !nodes.has(`/${top}/`) && !files[`/content/${top}/_index.md`]) {
      add({ url: `/${top}/`, title: `${titleCase(top)}s`, kind: 'section' });
    }
  }
  return nodes;
}

const nodes = buildNodes();

function parentOf(url: string): Node | undefined {
  const segments = url.split('/').filter(Boolean);
  for (let i = segments.length - 1; i >= 0; i--) {
    const candidate = nodes.get(
      i === 0 ? '/' : `/${segments.slice(0, i).join('/')}/`
    );
    if (candidate && candidate.kind !== 'page') return candidate;
  }
  return undefined;
}

function link({ title, url }: PageLink): PageLink {
  return { title, url };
}

function childrenOf(url: string): ChildLink[] {
  return [...nodes.values()]
    .filter((node) => node.url !== url && parentOf(node.url)?.url === url)
    .map((node) =>
      isPark(node) ? { ...link(node), park: parkMetaOf(node) } : link(node)
    )
    .sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

function ancestorsOf(url: string): PageLink[] {
  const ancestors: PageLink[] = [];
  for (let parent = parentOf(url); parent; parent = parentOf(parent.url)) {
    ancestors.unshift(link(parent));
  }
  return ancestors;
}

/**
 * Sections that group parks rather than being one. `type: 'park'` cascades
 * nowhere, but the town sections carry it too, so depth is what separates
 * them: `/town-parks/greece-parks/` holds parks, `/monroe-county-parks/x/`
 * is one.
 */
function isParkContainer(url: string): boolean {
  const segments = url.split('/').filter(Boolean);
  if (segments.length <= 1) return true;
  return segments.length === 2 && segments[0] === 'town-parks';
}

/**
 * A park is a `type: 'park'` node that hangs directly off a container. Some
 * sub-pages (`trails`, `history`) inherited the type by hand, so the type
 * alone would count them as parks of their own.
 */
function isPark(node: Node): boolean {
  const { type } = node.frontMatter;
  if (type !== 'park' && type !== 'county-parks') return false;
  if (isParkContainer(node.url)) return false;
  const parent = parentOf(node.url);
  return parent !== undefined && isParkContainer(parent.url);
}

/** Strips the trailing noun so a breadcrumb reads "Greece", not "Greece Parks". */
function sectionLabel(title: string): string {
  return title.replace(/\s+Parks$/i, '');
}

/**
 * `sameAs` is one flat list of URLs, but the pages are not alike: a Google
 * Maps pin and a town parks department page want different words. The host
 * is the only thing that tells them apart.
 */
function linkLabel(url: string): string {
  return new URL(url).hostname.endsWith('google.com')
    ? 'On Google Maps'
    : 'Official page';
}

/** One link per kind. A park with two Google pins says Google Maps once. */
function parkLinks(sameAs: string[]): ParkLink[] {
  const seen = new Set<string>();
  const links: ParkLink[] = [];
  for (const url of sameAs) {
    let label;
    try {
      label = linkLabel(url);
    } catch {
      continue; // Not a URL the browser could follow, so not a link.
    }
    if (seen.has(label)) continue;
    seen.add(label);
    links.push({ url, label });
  }
  return links;
}

/** Drops the country, which is the same for every park on the site. */
function parkAddress(node: Node): ParkAddress | undefined {
  const { streetAddress, addressLocality, addressRegion, postalCode } =
    node.frontMatter.address ?? {};
  if (!streetAddress && !addressLocality) return undefined;
  return { streetAddress, addressLocality, addressRegion, postalCode };
}

/**
 * The day the build runs. Every dated fact resolves against it, so the site
 * shows what is true today, and the daily rebuild keeps it true.
 */
const TODAY = buildDate();

/** YAML reads an unquoted date as a Date. The site keeps ISO strings. */
function isoDate(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === 'string' ? value : undefined;
}

/**
 * Checks each time as it is read, so a typo such as 'Dusk' or '7:00' fails
 * the build rather than printing wrong hours.
 */
function openingHoursOf(entries: OpeningHours[] = []): OpeningHours[] {
  return entries.map((entry) => {
    for (const time of [entry.opens, entry.closes]) {
      if (time !== undefined && !isTime(time)) {
        throw new Error(`Not 'HH:MM' or a sun word: "${time}"`);
      }
    }
    return {
      ...entry,
      validFrom: isoDate(entry.validFrom),
      validThrough: isoDate(entry.validThrough),
    };
  });
}

function parkMetaOf(node: Node): ParkMeta {
  const amenities = [
    ...new Set((node.frontMatter.amenities ?? []).map(normaliseAmenity)),
  ].sort((a, b) => a.localeCompare(b, 'en'));
  const parent = parentOf(node.url);
  const { latitude, longitude } = node.frontMatter.geo ?? {};
  return {
    amenities,
    wordCount: node.wordCount,
    photoCount: node.photoCount,
    photo: cardPhoto(node),
    geo:
      latitude !== undefined && longitude !== undefined
        ? { latitude, longitude }
        : undefined,
    acres: node.frontMatter.acres,
    address: parkAddress(node),
    links: parkLinks(node.frontMatter.sameAs ?? []),
    openingHours: node.frontMatter.openingHours
      ? openingHoursOf(node.frontMatter.openingHours)
      : undefined,
    closedOn: node.frontMatter.closedOn,
    facilities: node.frontMatter.facilities?.map((facility) => ({
      ...facility,
      openingHours: openingHoursOf(facility.openingHours),
    })),
    hoursCheckedOn: isoDate(node.frontMatter.hoursCheckedOn),
    status: {
      written: node.wordCount >= WRITTEN_WORD_FLOOR,
      inventoried: amenities.length > 0,
      photographed: node.photoCount > 0,
    },
    section: {
      title: parent ? sectionLabel(parent.title) : '',
      url: parent?.url ?? '/',
    },
  };
}

/** The hours the facts panel shows, resolved against the build date. */
function parkHours(meta: ParkMeta): ParkHours {
  return {
    grounds: hoursView(meta.openingHours ?? [], meta.closedOn ?? [], TODAY),
    facilities: (meta.facilities ?? []).flatMap((facility) => {
      const view = hoursView(
        facility.openingHours,
        facility.closedOn ?? [],
        TODAY
      );
      return view ? [{ name: facility.name, ...view }] : [];
    }),
    checkedOn: meta.hoursCheckedOn && formatDate(meta.hoursCheckedOn),
  };
}

/** The parks either side of this one in its section, for page-to-page paging. */
function neighboursOf(node: Node): { previous?: PageLink; next?: PageLink } {
  const parent = parentOf(node.url);
  if (!parent) return {};
  const siblings = childrenOf(parent.url).filter((child) => child.park);
  const here = siblings.findIndex((child) => child.url === node.url);
  if (here === -1) return {};
  return {
    previous: here > 0 ? link(siblings[here - 1]) : undefined,
    next: here < siblings.length - 1 ? link(siblings[here + 1]) : undefined,
  };
}

/** A section that lists parks, like a town or the county. */
function isParkSection(url: string): boolean {
  return (
    url !== '/' &&
    isParkContainer(url) &&
    childrenOf(url).some((child) => child.park !== undefined)
  );
}

function layoutOf(node: Node): Layout {
  if (node.kind === 'home') return 'home';
  // Whether a park is written as `_index.md` or `index.md` is a filing
  // detail, not a layout: both get the park page.
  if (isPark(node)) return 'park-single';
  if (node.kind === 'section') {
    return isParkSection(node.url) ? 'park-list' : 'default-list';
  }
  return 'default-single';
}

function breadcrumbJsonLd(trail: PageLink[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.title,
      url: absUrl(item.url),
      item: absUrl(item.url),
    })),
  };
}

/**
 * Drops empty values, at any depth. Most parks record little more than a
 * name, and a field with `""` or `null` in it claims to say something it
 * does not, so nothing empty is published.
 */
function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(compact).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => [key, compact(item)] as const)
      .filter(([, item]) => item !== undefined);
    // A node of nothing but its own @type says nothing.
    if (!entries.some(([key]) => key !== '@type')) return undefined;
    return Object.fromEntries(entries);
  }
  if (value === null || value === '') return undefined;
  return value;
}

/**
 * One Park node per park page, built from the park's own front matter and
 * body. Only the four always-true facts — the name, the URL, that it is a
 * park, and that it is free and open to the public — are stated for every
 * park; everything else appears only where the content records it.
 */
function parkJsonLd(node: Node, meta: ParkMeta): object {
  const fm = node.frontMatter;
  const image = node.photo && resolveImage(node.photo, node.url);
  const fallback = fm.image && resolveImage(fm.image, node.url);
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Park',
    '@id': absUrl(node.url),
    url: absUrl(node.url),
    name: node.title,
    description: fm.description,
    isAccessibleForFree: true,
    publicAccess: true,
    address: {
      '@type': 'PostalAddress',
      streetAddress: fm.address?.streetAddress,
      addressLocality: fm.address?.addressLocality,
      addressRegion: fm.address?.addressRegion,
      postalCode: fm.address?.postalCode,
      addressCountry: fm.address?.addressCountry,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: fm.geo?.latitude,
      longitude: fm.geo?.longitude,
    },
    image: image ?? fallback,
    telephone: fm.telephone,
    sameAs: fm.sameAs,
    ...hoursJsonLd(meta.openingHours ?? [], meta.closedOn ?? [], TODAY),
    containsPlace: facilitiesJsonLd(meta.facilities ?? [], TODAY),
    // schema.org Park has no size property, so acreage rides along as a
    // named value rather than being dropped.
    additionalProperty: fm.acres
      ? {
          '@type': 'PropertyValue',
          name: 'Area',
          value: fm.acres,
          unitText: 'acre',
        }
      : undefined,
    // The page's own amenity names, so the markup and the panel agree.
    amenityFeature: meta.amenities.map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
    containedInPlace: meta.section.title
      ? {
          '@type': 'Place',
          name: meta.section.title,
          url: absUrl(meta.section.url),
        }
      : undefined,
  }) as object;
}

/**
 * The path segment that holds the largest-first view of a park section. No
 * content folder uses this name, so it can never shadow a real page.
 */
const BY_SIZE = 'by-size/';

/**
 * A section earns a largest-first page once two of its parks are measured.
 * One figure is not an order, and a page of em dashes helps nobody.
 */
function measuredIn(url: string): number {
  return childrenOf(url).filter((child) => child.park?.acres !== undefined)
    .length;
}

/** Largest first. Parks with no figure keep their A-Z order, at the end. */
function bySize(a: ChildLink, b: ChildLink): number {
  const left = a.park?.acres;
  const right = b.park?.acres;
  if (left === undefined && right === undefined) return 0;
  if (left === undefined) return 1;
  if (right === undefined) return -1;
  return right - left || a.title.localeCompare(b.title, 'en');
}

/**
 * The same section, in a second order, as its own static page. A control
 * would need a client runtime on every page; a second page needs none.
 */
function bySizePage(sectionUrl: string): Page | undefined {
  const node = nodes.get(sectionUrl);
  if (!node || !isParkSection(sectionUrl) || measuredIn(sectionUrl) < 2) {
    return undefined;
  }
  const base = getPage(sectionUrl);
  if (!base) return undefined;
  const self = {
    title: `${node.title} by size`,
    url: `${sectionUrl}${BY_SIZE}`,
  };
  const trail = [...base.ancestors, link(node), self];
  return {
    ...base,
    ...self,
    description: `Every park in ${sectionLabel(node.title)}, largest first.`,
    canonical: sectionUrl,
    order: 'size',
    children: [...base.children].sort(bySize),
    ancestors: [...base.ancestors, link(node)],
    jsonLd: [breadcrumbJsonLd(trail)],
  };
}

/**
 * The path segment that holds the city section grouped by Neighborhood. Only
 * the city has Neighborhoods, so only the city has this page.
 */
const BY_NEIGHBORHOOD = 'by-neighborhood/';

/** The city section, grouped by Neighborhood, as its own static page. */
function byNeighborhoodPage(sectionUrl: string): Page | undefined {
  const node = nodes.get(sectionUrl);
  if (!node || !isCitySection(sectionUrl)) return undefined;
  const base = getPage(sectionUrl);
  if (!base) return undefined;
  const self = {
    title: `${node.title} by neighborhood`,
    url: `${sectionUrl}${BY_NEIGHBORHOOD}`,
  };
  const trail = [...base.ancestors, link(node), self];
  return {
    ...base,
    ...self,
    description: `Every park in ${sectionLabel(node.title)}, grouped by neighborhood.`,
    canonical: sectionUrl,
    order: 'neighborhood',
    ancestors: [...base.ancestors, link(node)],
    jsonLd: [breadcrumbJsonLd(trail)],
  };
}

export function getAllUrls(): string[] {
  const sections = [...nodes.keys()].filter(
    (url) => isParkSection(url) && measuredIn(url) >= 2
  );
  const cities = [...nodes.keys()].filter(isCitySection);
  return [
    ...nodes.keys(),
    ...sections.map((url) => `${url}${BY_SIZE}`),
    ...cities.map((url) => `${url}${BY_NEIGHBORHOOD}`),
  ];
}

/**
 * What the sitemap lists. A second ordering of a section holds no park the
 * section does not, and it already names the section as its canonical, so
 * offering it here would ask for a page we tell crawlers not to prefer.
 */
export function getIndexableUrls(): string[] {
  return getAllUrls().filter(
    (url) =>
      !url.endsWith(`/${BY_SIZE}`) && !url.endsWith(`/${BY_NEIGHBORHOOD}`)
  );
}

export function getPage(url: string): Page | undefined {
  if (url.endsWith(`/${BY_SIZE}`)) {
    return bySizePage(url.slice(0, -BY_SIZE.length));
  }
  if (url.endsWith(`/${BY_NEIGHBORHOOD}`)) {
    return byNeighborhoodPage(url.slice(0, -BY_NEIGHBORHOOD.length));
  }
  const node = nodes.get(url);
  if (!node) return undefined;

  const layout = layoutOf(node);
  const park = isPark(node) ? parkMetaOf(node) : undefined;
  const ancestors = ancestorsOf(url);
  const trail = [...ancestors, link(node)];
  const jsonLd =
    park && layout === 'park-single'
      ? [parkJsonLd(node, park), breadcrumbJsonLd(trail)]
      : layout === 'park-list'
        ? [breadcrumbJsonLd(trail)]
        : [];

  return {
    ...link(node),
    description: node.frontMatter.description ?? '',
    layout,
    html: node.html,
    children: childrenOf(url),
    ancestors,
    jsonLd,
    ...(layout === 'park-list'
      ? { section: { title: sectionLabel(node.title), url: node.url } }
      : {}),
    ...(park
      ? { park, hours: parkHours(park), neighbours: neighboursOf(node) }
      : {}),
    ...(layout === 'home' ? { summary: getSiteSummary() } : {}),
  };
}

/** Totals the home page states, all counted from the content itself. */
export function getSiteSummary(): SiteSummary {
  const parks = [...nodes.values()].filter(isPark).map(parkMetaOf);
  const { amenities, sections } = getParkIndex();
  return {
    parks: parks.length,
    written: parks.filter((park) => park.status.written).length,
    inventoried: parks.filter((park) => park.status.inventoried).length,
    photographed: parks.filter((park) => park.status.photographed).length,
    amenities,
    sections,
  };
}

/**
 * Everything the finder needs, built once at compile time and served as one
 * static file. The browser filters it; there is no server to ask.
 */
export function getParkIndex(): ParkIndex {
  const parks: ParkIndexEntry[] = [...nodes.values()]
    .filter(isPark)
    .map((node) => {
      const meta = parkMetaOf(node);
      return {
        title: node.title,
        url: node.url,
        section: meta.section.title,
        sectionUrl: meta.section.url,
        amenities: meta.amenities,
        written: meta.status.written,
        photographed: meta.status.photographed,
        acres: meta.acres,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'en'));

  const tally = <T>(items: T[], key: (item: T) => string) => {
    const counts = new Map<string, number>();
    for (const item of items) {
      const k = key(item);
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  };

  const amenityCounts = tally(
    parks.flatMap((park) => park.amenities),
    (name) => name
  );
  const sectionCounts = tally(parks, (park) => park.sectionUrl);

  return {
    parks,
    amenities: [...amenityCounts]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'en')),
    sections: [...sectionCounts]
      .map(([url, count]) => ({
        url,
        title: parks.find((park) => park.sectionUrl === url)?.section ?? '',
        count,
      }))
      .sort(
        (a, b) => b.count - a.count || a.title.localeCompare(b.title, 'en')
      ),
    unreachable: parks.filter((park) => park.amenities.length === 0).length,
  };
}
