/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { parkTransitionName } from './format.js';

describe('parkTransitionName', () => {
  test('names a part of a park by its whole path', () => {
    expect(
      parkTransitionName('/town-parks/greece-parks/basil-marella-park/', 'row')
    ).toBe('row-town-parks-greece-parks-basil-marella-park');
  });

  test('gives the row and the name of one park different names', () => {
    const path = '/town-parks/greece-parks/basil-marella-park/';
    expect(parkTransitionName(path, 'name')).toBe(
      'name-town-parks-greece-parks-basil-marella-park'
    );
    expect(parkTransitionName(path, 'name')).not.toBe(
      parkTransitionName(path, 'row')
    );
  });

  test('is a valid ident when the slug starts with a digit', () => {
    expect(
      parkTransitionName('/rochester-city-parks/1st-street-park/', 'name')
    ).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test('keeps two towns with the same park slug apart', () => {
    expect(
      parkTransitionName('/town-parks/greece-parks/veterans-park/', 'name')
    ).not.toBe(
      parkTransitionName('/town-parks/gates-parks/veterans-park/', 'name')
    );
  });

  test('turns any character an ident cannot hold into a hyphen', () => {
    expect(parkTransitionName('/state-parks/Park_Name.2/', 'row')).toBe(
      'row-state-parks-park-name-2'
    );
  });
});
