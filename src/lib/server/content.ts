import matter from 'gray-matter';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedSmartypants } from 'marked-smartypants';
import { SITE_TITLE, absUrl } from '$lib/site';
import type {
  ChildLink,
  Layout,
  Page,
  PageLink,
  ParkIndex,
  ParkIndexEntry,
  ParkMeta,
  SiteSummary,
} from '$lib/types';

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
  openingHours?: { dayOfWeek?: string[]; opens?: string; closes?: string }[];
  telephone?: string;
  amenities?: string[];
}

interface Node extends PageLink {
  kind: 'home' | 'section' | 'page';
  frontMatter: FrontMatter;
  html: string;
  /** Body words, excluding embeds and image syntax. */
  wordCount: number;
  photoCount: number;
}

/** Below this, a park page is a listing rather than a write-up. */
export const WRITTEN_WORD_FLOOR = 150;

// The source spells a few amenities two ways. Filtering only works if one
// thing has one name, so the variants collapse here rather than in the UI.
const AMENITY_ALIASES: Record<string, string> = {
  restrooms: 'Bathroom',
  'picnic area': 'Picnic Table',
};

function normaliseAmenity(name: string): string {
  const trimmed = name.trim();
  return AMENITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

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

const files = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

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

function parkMetaOf(node: Node): ParkMeta {
  const amenities = [
    ...new Set((node.frontMatter.amenities ?? []).map(normaliseAmenity)),
  ].sort((a, b) => a.localeCompare(b, 'en'));
  const parent = parentOf(node.url);
  return {
    amenities,
    wordCount: node.wordCount,
    photoCount: node.photoCount,
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

function parkJsonLd(node: Node): object {
  const fm = node.frontMatter;
  const address = fm.address ?? {};
  const hours = fm.openingHours?.[0] ?? {};
  return {
    '@context': 'https://schema.org',
    '@type': 'Park',
    name: node.title,
    description: fm.description ?? '',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.streetAddress ?? '',
      addressLocality: address.addressLocality ?? '',
      addressRegion: address.addressRegion ?? '',
      postalCode: address.postalCode ?? '',
      addressCountry: address.addressCountry ?? '',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: fm.geo?.latitude ?? null,
      longitude: fm.geo?.longitude ?? null,
    },
    url: absUrl(node.url),
    image: absUrl(fm.image ?? ''),
    sameAs: fm.sameAs ?? [],
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: (hours.dayOfWeek ?? []).map(
          (day) => `https://schema.org/${day}`
        ),
        opens: hours.opens ?? '',
        closes: hours.closes ?? '',
      },
    ],
    telephone: fm.telephone ?? '',
    amenityFeature: (fm.amenities ?? []).map((name) => ({
      '@type': 'LocationFeatureSpecification',
      name,
      value: true,
    })),
  };
}

export function getAllUrls(): string[] {
  return [...nodes.keys()];
}

export function getPage(url: string): Page | undefined {
  const node = nodes.get(url);
  if (!node) return undefined;

  const layout = layoutOf(node);
  const ancestors = ancestorsOf(url);
  const trail = [...ancestors, link(node)];
  const jsonLd =
    layout === 'park-list'
      ? [parkJsonLd(node), breadcrumbJsonLd(trail)]
      : layout === 'park-single'
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
    ...(isPark(node)
      ? { park: parkMetaOf(node), neighbours: neighboursOf(node) }
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
