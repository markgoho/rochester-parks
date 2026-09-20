/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  formatCoordinates,
  hostOf,
  longestWord,
  parkTransitionName,
  telHref,
} from './format.js';

describe('hostOf', () => {
  test('names the site without its "www."', () => {
    expect(hostOf('https://www.cityofrochester.gov/parks')).toBe(
      'cityofrochester.gov'
    );
    expect(hostOf('https://ogdenny.myrec.com/info/facilities/')).toBe(
      'ogdenny.myrec.com'
    );
  });

  test('a link the front matter got wrong fails the build', () => {
    expect(() => hostOf('ogdenny.myrec.com')).toThrow();
  });
});

describe('telHref', () => {
  test('a local number takes the country code', () => {
    expect(telHref('(585) 617-6174')).toBe('tel:+15856176174');
    expect(telHref('585-617-6174')).toBe('tel:+15856176174');
  });

  test('a number that already has its country code keeps it', () => {
    expect(telHref('+1 585 617 6174')).toBe('tel:+15856176174');
    // Ten digits of its own, and not a North American number.
    expect(telHref('+44 1234 5678')).toBe('tel:+4412345678');
  });

  test('anything else is dialled as written, digits only', () => {
    expect(telHref('311')).toBe('tel:311');
  });
});

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

describe('formatCoordinates', () => {
  test('rounds to four places, about eleven metres', () => {
    expect(
      formatCoordinates({ latitude: 43.2555295, longitude: -77.6412645 })
    ).toBe('43.2555, -77.6413');
  });

  test('keeps trailing zeros so the figures line up', () => {
    expect(formatCoordinates({ latitude: 43.1, longitude: -77.6 })).toBe(
      '43.1000, -77.6000'
    );
  });
});

describe('longestWord', () => {
  test('counts the letters of the longest word in a name', () => {
    expect(longestWord('Schaufelberger Park')).toBe(14);
  });

  test('ends a word after a hyphen, where a line can also break', () => {
    expect(longestWord('Durand-Eastman Park')).toBe(7);
  });
});
