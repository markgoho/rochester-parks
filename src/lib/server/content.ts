import matter from 'gray-matter';
import { Marked } from 'marked';
import { gfmHeadingId } from 'marked-gfm-heading-id';
import { markedSmartypants } from 'marked-smartypants';
import { SITE_TITLE, absUrl } from '$lib/site';
import type { Layout, Page, PageLink } from '$lib/types';

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
}

const files = import.meta.glob('/content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

// Goldmark defaults: heading ids, typographer, raw HTML omitted.
const markdown = new Marked(gfmHeadingId(), markedSmartypants(), {
  renderer: { html: () => '' },
});

function urlFor(file: string): string {
  const path = file.replace(/^\/content/, '');
  return path.replace(/(_index|index)\.md$/, '').replace(/\.md$/, '/');
}

function titleCase(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

function buildNodes(): Map<string, Node> {
  const nodes = new Map<string, Node>();
  const add = (node: Omit<Node, 'frontMatter' | 'html'> & Partial<Node>) =>
    nodes.set(node.url, { frontMatter: {}, html: '', ...node });

  add({ url: '/', title: SITE_TITLE, kind: 'home' });
  add({ url: '/categories/', title: 'Categories', kind: 'section' });
  add({ url: '/tags/', title: 'Tags', kind: 'section' });

  for (const [file, raw] of Object.entries(files)) {
    const { data, content } = matter(raw);
    const frontMatter = data as FrontMatter;
    const url = urlFor(file);
    add({
      url,
      title: frontMatter.title ?? '',
      kind: file.endsWith('/_index.md') ? 'section' : 'page',
      frontMatter,
      html: markdown.parse(content) as string,
    });

    // Hugo names an auto section after its folder, in plural form.
    const top = url.split('/')[1];
    if (!nodes.has(`/${top}/`) && !files[`/content/${top}/_index.md`]) {
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

function childrenOf(url: string): PageLink[] {
  return [...nodes.values()]
    .filter((node) => node.url !== url && parentOf(node.url)?.url === url)
    .map(link)
    .sort((a, b) => a.title.localeCompare(b.title, 'en'));
}

function ancestorsOf(url: string): PageLink[] {
  const ancestors: PageLink[] = [];
  for (let parent = parentOf(url); parent; parent = parentOf(parent.url)) {
    ancestors.unshift(link(parent));
  }
  return ancestors;
}

function layoutOf(node: Node): Layout {
  if (node.kind === 'home') return 'home';
  // `type` is read from the page's own front matter only; it does not cascade.
  const isPark = node.frontMatter.type === 'park';
  if (node.kind === 'section') return isPark ? 'park-list' : 'default-list';
  return isPark ? 'park-single' : 'default-single';
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
  };
}
