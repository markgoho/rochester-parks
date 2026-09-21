import { facilitiesJsonLd, hoursJsonLd } from './hours.js';
import { absUrl } from './site.js';
import type { FrontMatter, ParkMeta } from './types.js';

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

/** What `parkJsonLd` needs from a park page, independent of how it was loaded. */
export interface ParkJsonLdInput {
  url: string;
  title: string;
  frontMatter: FrontMatter;
  /** Resolved, absolute image URL, when the page has one that ships. */
  image?: string;
}

/**
 * One Park node per park page, built from the park's own front matter and
 * body. The name, the URL and that it is a park are always stated. A Park
 * is free and open to the public unless its front matter marks it
 * `planned` (a Planned Park, CONTEXT.md, ADR-0006), in which case those two
 * claims are left out rather than asserted false; everything else appears
 * only where the content records it.
 */
export function parkJsonLd(
  input: ParkJsonLdInput,
  meta: ParkMeta,
  today: string
): object {
  const fm = input.frontMatter;
  return compact({
    '@context': 'https://schema.org',
    '@type': 'Park',
    '@id': absUrl(input.url),
    url: absUrl(input.url),
    name: input.title,
    description: fm.description,
    ...(fm.planned ? {} : { isAccessibleForFree: true, publicAccess: true }),
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
    image: input.image,
    telephone: fm.telephone,
    sameAs: fm.sameAs,
    ...hoursJsonLd(meta.openingHours ?? [], meta.closedOn ?? [], today),
    containsPlace: facilitiesJsonLd(meta.facilities ?? [], today),
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
