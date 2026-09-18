/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { viewTransitionName } from './format.js';

describe('viewTransitionName', () => {
  test('names a park by its whole path', () => {
    expect(
      viewTransitionName('/town-parks/greece-parks/basil-marella-park/')
    ).toBe('park-town-parks-greece-parks-basil-marella-park');
  });

  test('is a valid ident when the slug starts with a digit', () => {
    expect(
      viewTransitionName('/rochester-city-parks/1st-street-park/')
    ).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  test('keeps two towns with the same park slug apart', () => {
    expect(
      viewTransitionName('/town-parks/greece-parks/veterans-park/')
    ).not.toBe(viewTransitionName('/town-parks/gates-parks/veterans-park/'));
  });

  test('turns any character an ident cannot hold into a hyphen', () => {
    expect(viewTransitionName('/state-parks/Park_Name.2/')).toBe(
      'park-state-parks-park-name-2'
    );
  });
});
