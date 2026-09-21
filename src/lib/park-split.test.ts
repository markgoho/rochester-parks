/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { splitFormerParks } from './park-split.js';
import type { ChildLink, ParkMeta } from './types.js';

const baseMeta: ParkMeta = {
  amenities: [],
  wordCount: 0,
  photoCount: 0,
  status: { written: false, inventoried: false, photographed: false },
  links: [],
  section: { title: 'Greece', url: '/town-parks/greece-parks/' },
  former: false,
};

describe('splitFormerParks', () => {
  test('a section holding one Former Park and one Park yields one park and one former park', () => {
    const park: ChildLink = {
      title: 'Adeline Park',
      url: '/town-parks/greece-parks/adeline-park/',
      park: { ...baseMeta, former: false },
    };
    const former: ChildLink = {
      title: 'Forest Hills Playground',
      url: '/town-parks/greece-parks/forest-hills-playground/',
      park: { ...baseMeta, former: true },
    };
    const result = splitFormerParks([park, former]);
    expect(result.active).toEqual([park]);
    expect(result.former).toEqual([former]);
  });

  test('a non-park child stays active: only a Former Park is pulled out', () => {
    const page: ChildLink = {
      title: 'History',
      url: '/town-parks/greece-parks/history/',
    };
    const result = splitFormerParks([page]);
    expect(result.active).toEqual([page]);
    expect(result.former).toEqual([]);
  });
});
