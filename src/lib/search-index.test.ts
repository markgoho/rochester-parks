/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { inSearchIndex } from './search-index.js';

describe('inSearchIndex', () => {
  test('a Park page is in the index', () => {
    expect(inSearchIndex({ layout: 'park-single' })).toBe(true);
  });

  test('a Former Park is not in the index (ADR-0010)', () => {
    expect(inSearchIndex({ layout: 'park-single', former: true })).toBe(
      false
    );
  });

  test('a Trail page waits on a later ticket', () => {
    expect(inSearchIndex({ layout: 'trail-single' })).toBe(false);
  });

  test('a Blog post or About page waits on a later ticket', () => {
    expect(inSearchIndex({ layout: 'default-single' })).toBe(false);
  });

  test('a Park List waits on a later ticket', () => {
    expect(inSearchIndex({ layout: 'park-list' })).toBe(false);
  });

  test('a default list page is not in the index', () => {
    expect(inSearchIndex({ layout: 'default-list' })).toBe(false);
  });

  test('home is not in the index', () => {
    expect(inSearchIndex({ layout: 'home' })).toBe(false);
  });
});
