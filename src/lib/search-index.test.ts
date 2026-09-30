/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  parkLine,
  parkPlace,
  searchEntryOf,
  trailLine,
} from './search-index.js';
import type { Page, ParkMeta } from './types.js';

const baseMeta: ParkMeta = {
  amenities: [],
  wordCount: 0,
  photoCount: 0,
  commentCount: 0,
  status: { written: false, inventoried: false, photographed: false },
  links: [],
  section: { title: 'Henrietta', url: '/town-parks/henrietta-parks/' },
  former: false,
  planned: false,
};

// Real Parks, so the second line is checked against the site's own content,
// not a hand-picked example (prior art: the JSON-LD and park-shapes tests).

/** Belmanor Park: filed under Henrietta, no acres recorded. */
const belmanor: ParkMeta = {
  ...baseMeta,
  geo: { latitude: 43.090607, longitude: -77.576826 },
};

/** Henrietta Veterans Memorial Park: a Town Park with an acreage. */
const henriettaVeterans: ParkMeta = {
  ...baseMeta,
  geo: { latitude: 43.0661678, longitude: -77.6219108 },
  acres: 90,
};

/** Mendon Ponds Park: a County Park at 2,500 acres, for the comma test. */
const mendonPonds: ParkMeta = {
  ...baseMeta,
  section: { title: 'Monroe County', url: '/monroe-county-parks/' },
  geo: { latitude: 43.021062601092915, longitude: -77.57617948425705 },
  acres: 2500,
};

/** Hamlin Beach State Park. */
const hamlinBeach: ParkMeta = {
  ...baseMeta,
  section: { title: 'State', url: '/state-parks/' },
  geo: { latitude: 43.3621185, longitude: -77.9547826 },
  acres: 671.98,
};

/** West High Park: a City Park in the 19th Ward. */
const westHigh: ParkMeta = {
  ...baseMeta,
  section: { title: 'Rochester', url: '/rochester-city-parks/' },
  geo: { latitude: 43.1430704, longitude: -77.6381868 },
  acres: 7,
};

/** High Falls State Park: the site's one Planned Park, standing in the city. */
const highFalls: ParkMeta = {
  ...baseMeta,
  section: { title: 'State', url: '/state-parks/' },
  geo: { latitude: 43.161314, longitude: -77.6134002 },
  planned: true,
};

/** Abraham Lincoln Park: the County Park behind one of the two Trails sub-pages. */
const abrahamLincoln: ParkMeta = {
  ...baseMeta,
  section: { title: 'Monroe County', url: '/monroe-county-parks/' },
  geo: { latitude: 43.184527, longitude: -77.512836 },
  acres: 182,
};

/** Chili Nature Trail. */
const chiliTrail: ParkMeta = {
  ...baseMeta,
  section: { title: 'Trails', url: '/trails/' },
  acres: 36,
};

describe('parkPlace', () => {
  test('a Town Park takes its town from its own point', () => {
    expect(parkPlace(belmanor)).toBe('Henrietta');
  });

  test('a County Park takes the town its point stands in', () => {
    expect(parkPlace(mendonPonds)).toBe('Mendon');
  });

  test('a State Park takes the town its point stands in', () => {
    expect(parkPlace(hamlinBeach)).toBe('Hamlin');
  });

  test('a State Park standing in the city names Rochester', () => {
    expect(parkPlace(highFalls)).toBe('Rochester');
  });

  test('a City Park names its Neighborhood and Rochester', () => {
    expect(parkPlace(westHigh)).toBe('19th Ward, Rochester');
  });

  test('a City Park outside every Neighborhood still names Rochester', () => {
    expect(
      parkPlace({
        ...baseMeta,
        section: { title: 'Rochester', url: '/rochester-city-parks/' },
      })
    ).toBe('Rochester');
  });

  test('a Park with no point falls back to its section, when the section names a town', () => {
    expect(parkPlace({ ...baseMeta, geo: undefined })).toBe('Henrietta');
  });

  test('a County Park with no point and no match names nothing', () => {
    expect(
      parkPlace({
        ...baseMeta,
        section: { title: 'Monroe County', url: '/monroe-county-parks/' },
        geo: undefined,
      })
    ).toBeUndefined();
  });

  test('a Trail in the city names Rochester, the same place its map draws', () => {
    // El Camino Trail: `townAt` does not name the city, but `placeAt` does.
    expect(
      parkPlace(
        {
          ...baseMeta,
          section: { title: 'Trails', url: '/trails/' },
          geo: { latitude: 43.1749357, longitude: -77.6192927 },
        },
        true
      )
    ).toBe('Rochester');
  });

  test('a Trail on Town land by the Webster library names Webster', () => {
    // Hickory Bark Woods: on tax parcel 079.11-1-10.1, 1002 Ridge Rd.
    expect(
      parkPlace(
        {
          ...baseMeta,
          section: { title: 'Trails', url: '/trails/' },
          geo: { latitude: 43.2125811, longitude: -77.459049 },
        },
        true
      )
    ).toBe('Webster');
  });
});

describe('parkLine', () => {
  test('Town Park: the town alone, with no acres recorded', () => {
    expect(parkLine(belmanor)).toBe('Henrietta');
  });

  test('Town Park: the town and the acreage', () => {
    expect(parkLine(henriettaVeterans)).toBe('Henrietta · 90 acres');
  });

  test('County Park: the town, the county, and the acreage, as one value', () => {
    expect(parkLine(mendonPonds)).toBe('Mendon · Monroe County · 2,500 acres');
  });

  test('State Park: the town, the state, and the acreage', () => {
    expect(parkLine(hamlinBeach)).toBe('Hamlin · New York State · 672 acres');
  });

  test('City Park: the Neighborhood, Rochester, and the acreage', () => {
    expect(parkLine(westHigh)).toBe('19th Ward, Rochester · 7 acres');
  });

  test('Planned Park: "Planned", the place and the owner, with no acreage', () => {
    expect(parkLine(highFalls)).toBe('Planned · Rochester · New York State');
  });

  test('a Park with no place, no owner and no acreage has no line at all', () => {
    expect(
      parkLine({
        ...baseMeta,
        section: { title: '', url: '/trails/' },
        geo: undefined,
      })
    ).toBeUndefined();
  });
});

describe('trailLine', () => {
  test('a Trail with a known acreage', () => {
    expect(trailLine(chiliTrail)).toBe('Trail · 36 acres');
  });

  test('a Trail with no acreage', () => {
    expect(
      trailLine({ ...baseMeta, section: { title: 'Trails', url: '/trails/' } })
    ).toBe('Trail');
  });
});

// Minimal, real Page shapes for each layout the index holds or does not
// (#297), enough for `searchEntryOf` to branch on.
const pageBase: Omit<Page, 'title' | 'url' | 'layout'> = {
  description: '',
  html: '',
  children: [],
  ancestors: [],
  jsonLd: [],
};

describe('searchEntryOf: which pages are in the index', () => {
  test('a Park page is in, titled and lined from its own point', () => {
    const page: Page = {
      ...pageBase,
      title: 'Belmanor Park',
      url: '/town-parks/henrietta-parks/belmanor-park/',
      layout: 'park-single',
      park: belmanor,
    };
    const entry = searchEntryOf(page);
    expect(entry).toMatchObject({
      indexed: true,
      title: 'Belmanor Park',
      line: 'Henrietta',
      place: 'Henrietta',
    });
    // The map is #323's own seam, tested on `placeMapSvg` directly
    // (search-map.test.ts); here it is enough to see the wiring reach it.
    expect(entry.map).toContain('<svg');
  });

  test("a Park's picture is its photo first, as on its card (#341)", () => {
    const page: Page = {
      ...pageBase,
      title: 'Belmanor Park',
      url: '/town-parks/henrietta-parks/belmanor-park/',
      layout: 'park-single',
      park: {
        ...belmanor,
        photo: '/town-parks/henrietta-parks/belmanor-park/featured.jpg',
      },
      outline: ['M0 0L10 0L10 4Z'],
    };
    const entry = searchEntryOf(page);
    expect(entry.photo).toBe(
      '/town-parks/henrietta-parks/belmanor-park/featured.jpg'
    );
    expect(entry.map).toBeUndefined();
  });

  test("with no photo, a Park's picture is its own outline, not its place map (#341)", () => {
    const page: Page = {
      ...pageBase,
      title: 'Belmanor Park',
      url: '/town-parks/henrietta-parks/belmanor-park/',
      layout: 'park-single',
      park: belmanor,
      outline: ['M0 0L10 0L10 4Z'],
    };
    const entry = searchEntryOf(page);
    expect(entry.photo).toBeUndefined();
    expect(entry.map).toContain('class="land"');
    expect(entry.map).not.toContain('class="dot"');
  });

  test('with no photo and no outline, the picture is the place map', () => {
    const page: Page = {
      ...pageBase,
      title: 'Belmanor Park',
      url: '/town-parks/henrietta-parks/belmanor-park/',
      layout: 'park-single',
      park: belmanor,
    };
    expect(searchEntryOf(page).map).toContain('class="dot"');
  });

  test('a Former Park is not in the index (ADR-0010)', () => {
    const page: Page = {
      ...pageBase,
      title: 'Forest Hills Playground',
      url: '/town-parks/greece-parks/forest-hills-playground/',
      layout: 'park-single',
      park: { ...baseMeta, former: true },
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });

  test('a Planned Park is in the index, planned line and all', () => {
    const page: Page = {
      ...pageBase,
      title: 'High Falls State Park',
      url: '/state-parks/high-falls-state-park/',
      layout: 'park-single',
      park: highFalls,
    };
    expect(searchEntryOf(page)).toEqual({
      indexed: true,
      title: 'High Falls State Park',
      line: 'Planned · Rochester · New York State',
      place: 'Rochester',
    });
  });

  test('a Trail page is in, with the Trail line', () => {
    const page: Page = {
      ...pageBase,
      title: 'Chili Nature Trail',
      url: '/trails/chili-nature-trail/',
      layout: 'trail-single',
      trail: chiliTrail,
    };
    expect(searchEntryOf(page)).toEqual({
      indexed: true,
      title: 'Chili Nature Trail',
      line: 'Trail · 36 acres',
      place: undefined,
    });
  });

  test('a Blog post is in, marked "Blog post"', () => {
    const page: Page = {
      ...pageBase,
      title: 'What Makes a Rochester Park Great',
      url: '/blog/2012/what-makes-a-rochester-park-great/',
      layout: 'default-single',
    };
    expect(searchEntryOf(page)).toEqual({
      indexed: true,
      title: 'What Makes a Rochester Park Great',
      line: 'Blog post',
    });
  });

  test('About is in, with no second line', () => {
    const page: Page = {
      ...pageBase,
      title: 'About',
      url: '/about/',
      layout: 'default-single',
    };
    expect(searchEntryOf(page)).toEqual({ indexed: true, title: 'About' });
  });

  test('a "Trails" sub-page is titled and lined after its Park', () => {
    const page: Page = {
      ...pageBase,
      title: 'Trails',
      url: '/monroe-county-parks/abraham-lincoln-park/trails/',
      layout: 'default-single',
      trailsOf: {
        title: 'Abraham Lincoln Park',
        park: abrahamLincoln,
        outline: ['M0 0L10 0L10 4Z'],
      },
    };
    const entry = searchEntryOf(page);
    expect(entry).toMatchObject({
      indexed: true,
      title: 'Trails, Abraham Lincoln Park',
      line: 'Penfield · Monroe County · 182 acres',
      place: 'Penfield',
    });
    // The Park's own picture: here its outline (#341).
    expect(entry.map).toContain('class="land"');
  });

  test('the main Park List of a section is in, marked "Park List"', () => {
    const page: Page = {
      ...pageBase,
      title: 'Greece Parks',
      url: '/town-parks/greece-parks/',
      layout: 'park-list',
    };
    expect(searchEntryOf(page)).toEqual({
      indexed: true,
      title: 'Greece Parks',
      line: 'Park List',
    });
  });

  test('a by-size ordering of a Park List is a duplicate, and stays out', () => {
    const page: Page = {
      ...pageBase,
      title: 'Greece Parks by size',
      url: '/town-parks/greece-parks/by-size/',
      layout: 'park-list',
      canonical: '/town-parks/greece-parks/',
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });

  test('the table view of a Park List is a duplicate, and stays out', () => {
    const page: Page = {
      ...pageBase,
      title: 'Greece Parks',
      url: '/town-parks/greece-parks/table/',
      layout: 'park-list',
      canonical: '/town-parks/greece-parks/',
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });

  test('the by-neighborhood ordering of the city is a duplicate, and stays out', () => {
    const page: Page = {
      ...pageBase,
      title: 'Rochester City Parks by neighborhood',
      url: '/rochester-city-parks/by-neighborhood/',
      layout: 'park-list',
      canonical: '/rochester-city-parks/',
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });

  test('home is not in the index', () => {
    const page: Page = {
      ...pageBase,
      title: 'Rochester Parks',
      url: '/',
      layout: 'home',
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });

  test('the Blog index is a default list, and stays out', () => {
    const page: Page = {
      ...pageBase,
      title: 'Blog',
      url: '/blog/',
      layout: 'default-list',
    };
    expect(searchEntryOf(page).indexed).toBe(false);
  });
});
