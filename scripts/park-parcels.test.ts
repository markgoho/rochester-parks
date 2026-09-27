/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  chooseParcels,
  isMiss,
  type ParcelFeature,
  type ParcelSource,
} from './park-parcels';

const POINT = { latitude: 43.1, longitude: -77.6 };

function feature(overrides: Partial<ParcelFeature>): ParcelFeature {
  return {
    id: 'p1',
    parkType: true,
    swis: 'Town of Brighton',
    acres: 10,
    geometry: [],
    ...overrides,
  };
}

/** A source whose behaviour each test sets by hand: no network, no geometry. */
function fakeSource(overrides: Partial<ParcelSource>): ParcelSource {
  return {
    containing: async () => [],
    near: async () => [],
    touching: async () => [],
    ...overrides,
  };
}

describe('chooseParcels', () => {
  test('a point on a park-type parcel seeds from it', async () => {
    const seed = feature({ id: 'a', acres: 12 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels(POINT, undefined, source);
    expect(isMiss(choice)).toBe(false);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
    expect(choice.acres).toBe(12);
    expect(choice.via).toBe('on');
  });

  test('a point on a road takes the nearest park-type parcel within 60 m', async () => {
    const near = feature({ id: 'b', acres: 8 });
    const source = fakeSource({
      containing: async () => [feature({ id: 'road', parkType: false })],
      near: async () => [near],
    });
    const choice = await chooseParcels(POINT, undefined, source);
    expect(isMiss(choice)).toBe(false);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['b']);
    expect(choice.via).toBe('near');
  });

  test('no park-type parcel on or near the point is a miss, with evidence', async () => {
    const water = feature({
      id: 'w',
      parkType: false,
      description: 'Water Supply',
    });
    const source = fakeSource({ containing: async () => [water] });
    const choice = await chooseParcels(POINT, undefined, source);
    expect(isMiss(choice)).toBe(true);
    if (!isMiss(choice)) throw new Error('unreachable');
    expect(choice.reason).toBe('no park-type parcel near the point');
    expect(choice.evidence).toEqual(water);
  });

  test('a touching parcel in a different municipality is not joined', async () => {
    const seed = feature({ id: 'a', swis: 'Town of Brighton', acres: 5 });
    const other = feature({ id: 'b', swis: 'Town of Pittsford', acres: 5 });
    const source = fakeSource({
      containing: async () => [seed],
      touching: async () => [other],
    });
    const choice = await chooseParcels(POINT, undefined, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('a touching parcel that is not park-type is not joined', async () => {
    const seed = feature({ id: 'a', acres: 5 });
    const road = feature({ id: 'r', parkType: false, acres: 1 });
    const source = fakeSource({
      containing: async () => [seed],
      touching: async () => [road],
    });
    const choice = await chooseParcels(POINT, undefined, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('growth is transitive: a parcel two hops away still joins', async () => {
    const a = feature({ id: 'a', acres: 5 });
    const b = feature({ id: 'b', acres: 5 });
    const c = feature({ id: 'c', acres: 5 });
    const source = fakeSource({
      containing: async () => [a],
      touching: async (chosen) => {
        const ids = chosen.map((f) => f.id);
        if (ids.includes('b')) return [a, b, c];
        return [a, b];
      },
    });
    const choice = await chooseParcels(POINT, undefined, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a', 'b', 'c']);
  });

  test('parcels far larger than the page acres are rejected as a mismatch', async () => {
    const seed = feature({ id: 'a', acres: 93 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels(POINT, 26.5, source);
    expect(isMiss(choice)).toBe(true);
    if (!isMiss(choice)) throw new Error('unreachable');
    expect(choice.reason).toBe("parcels much larger/smaller than the Park's acres");
    expect(choice.ids).toEqual(['a']);
    expect(choice.acres).toBe(93);
  });

  test('parcels within the acres factor are accepted', async () => {
    const seed = feature({ id: 'a', acres: 30 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels(POINT, 26.5, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('no acres on the page skips the check entirely', async () => {
    const seed = feature({ id: 'a', acres: 5000 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels(POINT, undefined, source);
    expect(isMiss(choice)).toBe(false);
  });
});
