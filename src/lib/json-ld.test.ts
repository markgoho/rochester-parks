/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { parkJsonLd } from './json-ld.js';
import type { FrontMatter, ParkMeta } from './types.js';

const TODAY = '2026-09-20';

const baseMeta: ParkMeta = {
  amenities: [],
  wordCount: 0,
  photoCount: 0,
  status: { written: false, inventoried: false, photographed: false },
  links: [],
  section: { title: 'State', url: '/state-parks/' },
  former: false,
};

const baseFrontMatter: FrontMatter = {
  description: 'A test park',
};

function jsonLdFor(frontMatter: FrontMatter, meta: ParkMeta = baseMeta) {
  return parkJsonLd(
    { url: '/state-parks/test-park/', title: 'Test Park', frontMatter },
    meta,
    TODAY
  ) as Record<string, unknown>;
}

describe('parkJsonLd', () => {
  test('a Park with no planned flag is free and open to the public', () => {
    const node = jsonLdFor(baseFrontMatter);
    expect(node.isAccessibleForFree).toBe(true);
    expect(node.publicAccess).toBe(true);
  });

  test('a Park with planned: false is free and open to the public', () => {
    const node = jsonLdFor({ ...baseFrontMatter, planned: false });
    expect(node.isAccessibleForFree).toBe(true);
    expect(node.publicAccess).toBe(true);
  });

  test('a Planned Park omits the free-and-open-to-the-public claims, but still states its name, URL and type', () => {
    const node = jsonLdFor({ ...baseFrontMatter, planned: true });
    expect('isAccessibleForFree' in node).toBe(false);
    expect('publicAccess' in node).toBe(false);
    expect(node['@type']).toBe('Park');
    expect(node.name).toBe('Test Park');
    expect(node.url).toBe('https://rochesterparks.org/state-parks/test-park/');
  });

  test('a Former Park publishes no amenities, hours or facilities as present facts', () => {
    const node = jsonLdFor(baseFrontMatter, {
      ...baseMeta,
      former: true,
      amenities: ['Playground', 'Swingset'],
      openingHours: [{ dayOfWeek: ['Monday'], opens: '09:00', closes: '17:00' }],
      facilities: [{ name: 'Shelter 1', type: 'EventVenue' }],
    });
    expect('amenityFeature' in node).toBe(false);
    expect('openingHoursSpecification' in node).toBe(false);
    expect('containsPlace' in node).toBe(false);
    expect('isAccessibleForFree' in node).toBe(false);
    expect('publicAccess' in node).toBe(false);
    expect(node['@type']).toBe('Park');
    expect(node.name).toBe('Test Park');
  });

  test('a non-Former Park with amenities still publishes them as present facts', () => {
    const node = jsonLdFor(baseFrontMatter, {
      ...baseMeta,
      amenities: ['Playground'],
    });
    expect(node.amenityFeature).toEqual([
      {
        '@type': 'LocationFeatureSpecification',
        name: 'Playground',
        value: true,
      },
    ]);
  });
});
