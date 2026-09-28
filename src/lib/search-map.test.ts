/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  MAP_STYLE,
  parkShapeSvg,
  placeMapSvg,
  placeShape,
} from './search-map.js';
import type { ParkMeta } from './types.js';

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

/** West High Park: a City Park in the 19th Ward. */
const westHigh: ParkMeta = {
  ...baseMeta,
  section: { title: 'Rochester', url: '/rochester-city-parks/' },
  geo: { latitude: 43.1430704, longitude: -77.6381868 },
};

/** Mendon Ponds Park: a County Park standing in the Town of Mendon, which
 * holds the Village of Honeoye Falls. */
const mendonPonds: ParkMeta = {
  ...baseMeta,
  section: { title: 'Monroe County', url: '/monroe-county-parks/' },
  geo: { latitude: 43.021062601092915, longitude: -77.57617948425705 },
};

/** Egypt Park: a Town Park in Perinton, which holds the Village of
 * Fairport. */
const egyptPark: ParkMeta = {
  ...baseMeta,
  section: { title: 'Perinton', url: '/town-parks/perinton-parks/' },
  geo: { latitude: 43.063189, longitude: -77.3987923 },
};

/** High Falls State Park: stands in the City of Rochester, but under the
 * state section, so it takes neither the city's Neighborhood lookup nor a
 * town's: the same fallback the Park page takes to its TownLocator. */
const highFalls: ParkMeta = {
  ...baseMeta,
  section: { title: 'State', url: '/state-parks/' },
  geo: { latitude: 43.161314, longitude: -77.6134002 },
};

/** A point far outside Monroe County: in no town and no Neighborhood. */
const outside = { latitude: 42.5, longitude: -76.5 };

describe('placeShape', () => {
  test('a City Park takes its Neighborhood, with no villages', () => {
    const found = placeShape(westHigh, false);
    expect(found?.city).toBe(true);
    expect(found?.neighborhood?.name).toBe('19th Ward');
    expect(found?.shape?.name).toBe('19th Ward');
    expect(found?.villages).toEqual([]);
    expect(found?.where).toBe('19th Ward');
  });

  test("a County Park takes the town its point stands in, with the town's villages", () => {
    const found = placeShape(mendonPonds, false);
    expect(found?.city).toBe(false);
    expect(found?.neighborhood).toBeUndefined();
    expect(found?.shape?.key).toBe('mendon');
    expect(found?.villages.map((v) => v.key)).toEqual(['honeoye-falls']);
    expect(found?.where).toBe('Mendon');
  });

  test("a Town Park takes its own town, with the town's villages", () => {
    const found = placeShape(egyptPark, false);
    expect(found?.shape?.key).toBe('perinton');
    expect(found?.villages.map((v) => v.key)).toEqual(['fairport']);
    expect(found?.where).toBe('Perinton');
  });

  test('a Park with no point has no place', () => {
    expect(placeShape({ ...baseMeta, geo: undefined }, false)).toBeUndefined();
  });

  test('a State Park standing in the city has no shape and no place name', () => {
    // No Neighborhood lookup off a state section, and `townAt` excludes the
    // city, so the Park page draws no map here: the search result must
    // match, not fall back to `parkPlace`'s more lenient `placeAt`.
    const found = placeShape(highFalls, false);
    expect(found?.shape).toBeUndefined();
    expect(found?.where).toBeUndefined();
  });

  test('a County Park outside every outline is placed in the county, with no shape', () => {
    const found = placeShape({ ...mendonPonds, geo: outside }, false);
    expect(found?.shape).toBeUndefined();
    expect(found?.villages).toEqual([]);
    expect(found?.where).toBe('Monroe County');
  });

  test('a City Park outside every Neighborhood is placed in the city, with no shape', () => {
    const found = placeShape({ ...westHigh, geo: outside }, false);
    expect(found?.city).toBe(true);
    expect(found?.neighborhood).toBeUndefined();
    expect(found?.shape).toBeUndefined();
    expect(found?.where).toBe('Rochester');
  });

  test('a Trail takes the place its point stands in, county-wide, even inside the city', () => {
    const inTown = placeShape(
      {
        ...baseMeta,
        section: { title: 'Trails', url: '/trails/' },
        geo: egyptPark.geo,
      },
      true
    );
    expect(inTown?.shape?.key).toBe('perinton');

    const inCity = placeShape(
      {
        ...baseMeta,
        section: { title: 'Trails', url: '/trails/' },
        geo: highFalls.geo,
      },
      true
    );
    expect(inCity?.city).toBe(false);
    expect(inCity?.neighborhood).toBeUndefined();
    expect(inCity?.shape?.key).toBe('rochester');
  });
});

describe('placeMapSvg', () => {
  test('a City Park with a Neighborhood shape draws the outline, water and dot', () => {
    const svg = placeMapSvg(westHigh, false);
    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="[-\d. ]+">/
    );
    expect(svg).toContain('class="outline"');
    expect(svg).toContain('class="water river"');
    expect(svg).toContain('class="water canal"');
    expect(svg).toContain('class="dot"');
    expect(svg).not.toContain('class="village"');
  });

  test("a Town Park's map carries its villages", () => {
    const svg = placeMapSvg(egyptPark, false);
    expect(svg).toContain('class="village"');
    expect(svg).toContain('class="water canal"');
    expect(svg).not.toContain('class="water river"');
  });

  test('a Park with no water nearby draws no water path', () => {
    const svg = placeMapSvg(mendonPonds, false);
    expect(svg).not.toContain('class="water');
  });

  test('a Park with no point has no map', () => {
    expect(placeMapSvg({ ...baseMeta, geo: undefined }, false)).toBeUndefined();
  });

  test('a Park with no shape (the Park page falls back) has no map', () => {
    expect(placeMapSvg(highFalls, false)).toBeUndefined();
  });

  test('the map is a file on its own, with its styles inside it', () => {
    // Shown with `<img>` (#333), so it gets none of the page's CSS.
    const svg = placeMapSvg(egyptPark, false)!;
    expect(svg).toContain('<style>');
    expect(svg).toContain(`fill:${MAP_STYLE['--land']}`);
  });

  test('the dot keeps its whole circle inside the view box', () => {
    // An `<img>` clips at its edge, where the inline SVG could overflow.
    const svg = placeMapSvg(egyptPark, false)!;
    const [x, y, w, h] = /viewBox="([^"]+)"/
      .exec(svg)![1]
      .split(' ')
      .map(Number);
    const [cx, cy, r] = ['cx', 'cy', 'r'].map((a) =>
      Number(new RegExp(` ${a}="([^"]+)"`).exec(svg)![1])
    );
    expect(cx - r).toBeGreaterThan(x);
    expect(cy - r).toBeGreaterThan(y);
    expect(cx + r).toBeLessThan(x + w);
    expect(cy + r).toBeLessThan(y + h);
  });
});

describe('parkShapeSvg', () => {
  test("draws the Park's own land in a square, with its styles inside it", () => {
    const svg = parkShapeSvg(['M0 0L10 0L10 4Z', 'M20 0L22 0L22 2Z']);
    const [, , w, h] = /viewBox="([^"]+)"/.exec(svg)![1].split(' ').map(Number);
    expect(w).toBe(h);
    expect(svg.match(/class="land"/g)).toHaveLength(2);
    expect(svg).toContain(`fill:${MAP_STYLE['--park']}`);
  });
});

describe('MAP_STYLE', () => {
  test('each value is the value of its token in app.css', async () => {
    // A color token is set twice, the `hsl` fallback and then the `oklch`
    // value every current browser takes; the map takes the last one.
    const appCss = await Bun.file(
      new URL('../app.css', import.meta.url)
    ).text();
    for (const [token, value] of Object.entries(MAP_STYLE)) {
      const all = [
        ...appCss.matchAll(new RegExp(`\\s${token}:\\s*([^;]+);`, 'g')),
      ];
      expect({ token, value: all.at(-1)?.[1] }).toEqual({ token, value });
    }
  });
});
