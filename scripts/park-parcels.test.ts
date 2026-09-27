/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  addressMatch,
  chooseParcels,
  GROWTH_ROUNDS,
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

/**
 * A source whose behaviour each test sets by hand: no network, no geometry.
 * Defaults to `hasSwis: true` (a county-style source); a test for the city
 * rule sets it `false`.
 */
function fakeSource(overrides: Partial<ParcelSource>): ParcelSource {
  return {
    hasSwis: true,
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
    const choice = await chooseParcels(POINT, source);
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
    const choice = await chooseParcels(POINT, source);
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
    const choice = await chooseParcels(POINT, source);
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
    const choice = await chooseParcels(POINT, source);
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
    const choice = await chooseParcels(POINT, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('a county seed with no swis joins no neighbours', async () => {
    const seed = feature({ id: 'a', swis: undefined, acres: 5 });
    const other = feature({ id: 'b', swis: 'Town of Brighton', acres: 5 });
    const source = fakeSource({
      containing: async () => [seed],
      touching: async () => [other],
    });
    const choice = await chooseParcels(POINT, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('a city seed with no swis still joins touching park-type parcels', async () => {
    const seed = feature({ id: 'a', swis: undefined, acres: 5 });
    const other = feature({ id: 'b', swis: undefined, acres: 5 });
    const source = fakeSource({
      hasSwis: false,
      containing: async () => [seed],
      touching: async (chosen) =>
        chosen.map((f) => f.id).includes('b') ? [] : [other],
    });
    const choice = await chooseParcels(POINT, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a', 'b']);
  });

  test('growth that never stabilizes is a miss, not an incomplete outline', async () => {
    let round = 0;
    const source = fakeSource({
      containing: async () => [feature({ id: 's-0', acres: 1 })],
      touching: async (chosen) => {
        round++;
        return [...chosen, feature({ id: `s-${round}`, acres: 1 })];
      },
    });
    const choice = await chooseParcels(POINT, source);
    expect(isMiss(choice)).toBe(true);
    if (!isMiss(choice)) throw new Error('unreachable');
    expect(choice.reason).toBe(`parcels kept growing past ${GROWTH_ROUNDS} rounds`);
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
    const choice = await chooseParcels(POINT, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a', 'b', 'c']);
  });

  test('parcels far larger than the page acres are rejected as a mismatch', async () => {
    const seed = feature({ id: 'a', acres: 93 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels({ ...POINT, acres: 26.5 }, source);
    expect(isMiss(choice)).toBe(true);
    if (!isMiss(choice)) throw new Error('unreachable');
    expect(choice.reason).toBe("parcels much larger/smaller than the Park's acres");
    expect(choice.ids).toEqual(['a']);
    expect(choice.acres).toBe(93);
  });

  test('parcels within the acres factor are accepted', async () => {
    const seed = feature({ id: 'a', acres: 30 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels({ ...POINT, acres: 26.5 }, source);
    if (isMiss(choice)) throw new Error('unreachable');
    expect(choice.ids).toEqual(['a']);
  });

  test('no acres on the page skips the check entirely', async () => {
    const seed = feature({ id: 'a', acres: 5000 });
    const source = fakeSource({ containing: async () => [seed] });
    const choice = await chooseParcels(POINT, source);
    expect(isMiss(choice)).toBe(false);
  });
});

describe('addressMatch', () => {
  test('the same number and street is a full match', () => {
    expect(addressMatch('1862 Penfield Road', { number: '1862', street: 'Penfield' })).toBe('full');
    expect(addressMatch('199 East Manitou Road', { number: '199', street: 'E Manitou' })).toBe('full');
    expect(addressMatch('3850 East Henrietta Rd.', { number: '3850', street: 'East Henrietta' })).toBe('full');
  });

  test('a different number on the same street is no match', () => {
    expect(addressMatch('1601 Penfield Road', { number: '1201', street: 'Penfield' })).toBeUndefined();
  });

  test('the same street, with no number on one side, is a street match', () => {
    expect(addressMatch('Elmwood Ave', { number: '2225', street: 'Elmwood' })).toBe('street');
    expect(addressMatch('1133 Crittenden Rd', { street: 'Crittenden' })).toBe('street');
  });

  test('another street is no match', () => {
    expect(addressMatch('Rudman Road', { street: 'Seneca' })).toBeUndefined();
    expect(addressMatch(undefined, { number: '1', street: 'Main' })).toBeUndefined();
    expect(addressMatch('1 Main St', undefined)).toBeUndefined();
  });
});

describe('a parcel under the point that is not park-type', () => {
  const vacant = (overrides: Partial<ParcelFeature>) =>
    feature({ id: 'v', parkType: false, classCode: 311, acres: 9.6, ...overrides });

  test('seeds when the page address and acres agree', async () => {
    const source = fakeSource({
      containing: async () => [vacant({ address: { number: '461', street: 'Bonesteel' } })],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 9, address: '461 Bonesteel Street', name: 'Columbus Park' },
      source
    );
    if (isMiss(choice)) throw new Error(choice.reason);
    expect(choice.ids).toEqual(['v']);
    expect(choice.via).toBe('on');
  });

  test('seeds when a City owner name holds the Park name and acres agree', async () => {
    const source = fakeSource({
      hasSwis: false,
      containing: async () => [
        vacant({ swis: undefined, classCode: 822, acres: 104.5, owner: 'City Of Roch Cobbs Hill Reserv' }),
      ],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 109, name: "Cobb's Hill Park and Washington Grove" },
      source
    );
    expect(isMiss(choice)).toBe(false);
  });

  test('one signal alone is not enough', async () => {
    const source = fakeSource({
      containing: async () => [vacant({ address: { number: '15', street: 'Long Pond' }, acres: 3 })],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 2, address: '15 Long Pond Road', name: 'Goodwin Park' },
      source
    );
    expect(isMiss(choice)).toBe(true);
  });

  test('acres that differ by more than 15% are not a signal', async () => {
    const source = fakeSource({
      containing: async () => [vacant({ address: { street: 'Latta' }, acres: 43.6 })],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 73.64, address: 'Latta Road', name: 'Klafehn Park' },
      source
    );
    expect(isMiss(choice)).toBe(true);
  });

  test('City O-S zoning at the point is a signal', async () => {
    const source = fakeSource({
      hasSwis: false,
      containing: async () => [vacant({ swis: undefined, acres: 0.28 })],
      openSpace: async () => true,
    });
    const choice = await chooseParcels({ ...POINT, acres: 0.3, name: 'Quamina Park' }, source);
    expect(isMiss(choice)).toBe(false);
  });

  test('a house lot never counts its acres as a signal', async () => {
    const source = fakeSource({
      containing: async () => [
        vacant({ classCode: 210, address: { street: 'Maplewood' }, acres: 1 }),
      ],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 1, address: 'Maplewood Ave', name: 'Big Eddy Park' },
      source
    );
    expect(isMiss(choice)).toBe(true);
  });
});

describe('growth', () => {
  test('stops at a parcel that is another Park\'s seed', async () => {
    const a = feature({ id: 'a', acres: 20 });
    const b = feature({ id: 'b', acres: 20 });
    const source = fakeSource({
      containing: async () => [a],
      touching: async () => [b],
    });
    const choice = await chooseParcels({ ...POINT, acres: 20 }, source, new Set(['b']));
    if (isMiss(choice)) throw new Error(choice.reason);
    expect(choice.ids).toEqual(['a']);
  });

  test('stops at a parcel that pushes the total far past the page acres', async () => {
    const seed = feature({ id: 'a', acres: 6.9 });
    const big = feature({ id: 'b', acres: 660 });
    const source = fakeSource({
      containing: async () => [seed],
      touching: async () => [big],
    });
    const choice = await chooseParcels({ ...POINT, acres: 4 }, source);
    if (isMiss(choice)) throw new Error(choice.reason);
    expect(choice.ids).toEqual(['a']);
  });

  test('a seed of another class whose acres agree does not grow', async () => {
    const seed = feature({ id: 'a', parkType: false, classCode: 652, acres: 47.7, address: { number: '1350', street: 'Turk Hill' } });
    const trail = feature({ id: 'b', acres: 43.2 });
    const source = fakeSource({
      containing: async () => [seed],
      touching: async () => [trail],
    });
    const choice = await chooseParcels(
      { ...POINT, acres: 49, address: '1350 Turk Hill Road', name: 'Center Park West' },
      source
    );
    if (isMiss(choice)) throw new Error(choice.reason);
    expect(choice.ids).toEqual(['a']);
  });
});
