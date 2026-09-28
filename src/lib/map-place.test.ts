/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { mapPlace } from './map-place.js';
import {
  baseMeta,
  egyptPark,
  highFalls,
  mendonPonds,
  outside,
  westHigh,
} from './place-fixtures.js';

describe('mapPlace', () => {
  test('a City Park takes its Neighborhood, with no villages', () => {
    const found = mapPlace(westHigh, false);
    expect(found?.city).toBe(true);
    expect(found?.neighborhood?.name).toBe('19th Ward');
    expect(found?.shape?.name).toBe('19th Ward');
    expect(found?.villages).toEqual([]);
    expect(found?.where).toBe('19th Ward');
  });

  test("a County Park takes the town its point stands in, with the town's villages", () => {
    const found = mapPlace(mendonPonds, false);
    expect(found?.city).toBe(false);
    expect(found?.neighborhood).toBeUndefined();
    expect(found?.shape?.key).toBe('mendon');
    expect(found?.villages.map((v) => v.key)).toEqual(['honeoye-falls']);
    expect(found?.where).toBe('Mendon');
  });

  test("a Town Park takes its own town, with the town's villages", () => {
    const found = mapPlace(egyptPark, false);
    expect(found?.shape?.key).toBe('perinton');
    expect(found?.villages.map((v) => v.key)).toEqual(['fairport']);
    expect(found?.where).toBe('Perinton');
  });

  test('a Park with no point has no place', () => {
    expect(mapPlace({ ...baseMeta, geo: undefined }, false)).toBeUndefined();
  });

  test('a State Park standing in the city has no shape and no place name', () => {
    // No Neighborhood lookup off a state section, and `townAt` excludes the
    // city, so the Park page draws no map here: the search result must
    // match, not fall back to `parkPlace`'s more lenient `placeAt`.
    const found = mapPlace(highFalls, false);
    expect(found?.shape).toBeUndefined();
    expect(found?.where).toBeUndefined();
  });

  test('a County Park outside every outline is placed in the county, with no shape', () => {
    const found = mapPlace({ ...mendonPonds, geo: outside }, false);
    expect(found?.shape).toBeUndefined();
    expect(found?.villages).toEqual([]);
    expect(found?.where).toBe('Monroe County');
  });

  test('a City Park outside every Neighborhood is placed in the city, with no shape', () => {
    const found = mapPlace({ ...westHigh, geo: outside }, false);
    expect(found?.city).toBe(true);
    expect(found?.neighborhood).toBeUndefined();
    expect(found?.shape).toBeUndefined();
    expect(found?.where).toBe('Rochester');
  });

  test('a Trail takes the place its point stands in, county-wide, even inside the city', () => {
    const inTown = mapPlace(
      {
        ...baseMeta,
        section: { title: 'Trails', url: '/trails/' },
        geo: egyptPark.geo,
      },
      true
    );
    expect(inTown?.shape?.key).toBe('perinton');

    const inCity = mapPlace(
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
