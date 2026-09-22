/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { isParkContainer, isParkType, isTrailType } from './park-types.js';

describe('isParkType', () => {
  test('accepts both Park front-matter types', () => {
    expect(isParkType('park')).toBe(true);
    expect(isParkType('county-parks')).toBe(true);
  });

  test('rejects anything else', () => {
    expect(isParkType('trail')).toBe(false);
    expect(isParkType(undefined)).toBe(false);
  });
});

describe('isTrailType', () => {
  test('accepts the Trail front-matter type', () => {
    expect(isTrailType('trail')).toBe(true);
  });

  test('rejects a Park type or anything else, so a page cannot be both', () => {
    expect(isTrailType('park')).toBe(false);
    expect(isTrailType('county-parks')).toBe(false);
    expect(isTrailType(undefined)).toBe(false);
  });
});

describe('isParkContainer', () => {
  test('is true one level deep, and for a town section two levels deep', () => {
    expect(isParkContainer('/monroe-county-parks/')).toBe(true);
    expect(isParkContainer('/town-parks/greece-parks/')).toBe(true);
  });

  test('is false for a park itself, or a non-town section two levels deep', () => {
    expect(isParkContainer('/monroe-county-parks/highland-park/')).toBe(false);
    expect(isParkContainer('/town-parks/greece-parks/adeline-park/')).toBe(
      false
    );
  });
});
