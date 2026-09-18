/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { parkRowTransitionName } from './format.js';

describe('parkRowTransitionName', () => {
  test('names a park by its whole path', () => {
    expect(
      parkRowTransitionName('/town-parks/greece-parks/basil-marella-park/')
    ).toBe('park-town-parks-greece-parks-basil-marella-park');
  });

  test('is a valid ident when the slug starts with a digit', () => {
    expect(
      parkRowTransitionName('/rochester-city-parks/1st-street-park/')
    ).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test('keeps two towns with the same park slug apart', () => {
    expect(
      parkRowTransitionName('/town-parks/greece-parks/veterans-park/')
    ).not.toBe(parkRowTransitionName('/town-parks/gates-parks/veterans-park/'));
  });

  test('turns any character an ident cannot hold into a hyphen', () => {
    expect(parkRowTransitionName('/state-parks/Park_Name.2/')).toBe(
      'park-state-parks-park-name-2'
    );
  });
});
