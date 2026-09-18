/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  mapAmenities,
  mergeAmenities,
  normaliseAmenity,
  withAmenities,
} from './amenities.js';

const MAP = {
  playground: ['Playground'],
  'playgrounds (ages 2-5 and 5-12)': ['Playground'],
  'tennis/pickleball courts': ['Tennis Court', 'Pickleball Court'],
  'parking areas': [],
};

describe('mapAmenities', () => {
  test('trims and lowercases each string before it looks it up', () => {
    expect(mapAmenities(['  Playground ', 'PLAYGROUND'], MAP).names).toEqual([
      'Playground',
    ]);
  });

  test('one string can give more than one amenity', () => {
    expect(mapAmenities(['Tennis/Pickleball Courts'], MAP).names).toEqual([
      'Tennis Court',
      'Pickleball Court',
    ]);
  });

  test('a string mapped to nothing gives no amenity', () => {
    expect(mapAmenities(['Parking Areas'], MAP)).toEqual({
      names: [],
      unmapped: [],
    });
  });

  test('a string that is not in the map is reported, not guessed', () => {
    expect(mapAmenities(['Zip line', 'Playground'], MAP)).toEqual({
      names: ['Playground'],
      unmapped: ['Zip line'],
    });
  });
});

describe('mergeAmenities', () => {
  test('keeps every amenity the Park has and adds the new ones, sorted', () => {
    expect(
      mergeAmenities(['Tennis Court', 'Barbecue'], ['Playground'])
    ).toEqual(['Barbecue', 'Playground', 'Tennis Court']);
  });

  test('adds nothing that the Park has under an alias', () => {
    expect(mergeAmenities(['Restrooms'], ['Bathroom'])).toEqual(['Restrooms']);
  });

  test('keeps an existing entry as it is written', () => {
    expect(mergeAmenities(['Picnic Area'], ['Lodge'])).toEqual([
      'Lodge',
      'Picnic Area',
    ]);
  });
});

describe('normaliseAmenity', () => {
  test('collapses the known aliases', () => {
    expect(normaliseAmenity(' restrooms')).toBe('Bathroom');
    expect(normaliseAmenity('Picnic Area')).toBe('Picnic Table');
    expect(normaliseAmenity('Lodge')).toBe('Lodge');
  });
});

describe('withAmenities', () => {
  test('replaces an existing list and leaves the rest alone', () => {
    const source = [
      '---',
      "title: 'A Park'",
      'amenities:',
      '  - Tennis Court',
      '  - Barbecue',
      'geo:',
      '  latitude: 43.1',
      '---',
      '',
      'Body text.',
      '',
    ].join('\n');
    expect(withAmenities(source, ['Barbecue', 'Playground'])).toBe(
      [
        '---',
        "title: 'A Park'",
        'amenities:',
        '  - Barbecue',
        '  - Playground',
        'geo:',
        '  latitude: 43.1',
        '---',
        '',
        'Body text.',
        '',
      ].join('\n')
    );
  });

  test('keeps the quotes when the list already quotes its entries', () => {
    const source = ['---', 'amenities:', "  - 'Shelter'", '---', ''].join('\n');
    expect(withAmenities(source, ['Playground', 'Shelter'])).toBe(
      [
        '---',
        'amenities:',
        "  - 'Playground'",
        "  - 'Shelter'",
        '---',
        '',
      ].join('\n')
    );
  });

  test('adds a list before sameAs when the Park has none', () => {
    const source = [
      '---',
      "title: 'A Park'",
      'acres: 19',
      'sameAs:',
      "  - 'https://example.gov/park'",
      '---',
      'Body.',
    ].join('\n');
    expect(withAmenities(source, ['Playground'])).toBe(
      [
        '---',
        "title: 'A Park'",
        'acres: 19',
        'amenities:',
        '  - Playground',
        'sameAs:',
        "  - 'https://example.gov/park'",
        '---',
        'Body.',
      ].join('\n')
    );
  });

  test('adds a list at the end of the front matter when there is no sameAs', () => {
    const source = ['---', "title: 'A Park'", '---', 'Body.'].join('\n');
    expect(withAmenities(source, ['Playground'])).toBe(
      [
        '---',
        "title: 'A Park'",
        'amenities:',
        '  - Playground',
        '---',
        'Body.',
      ].join('\n')
    );
  });

  test('does not touch a sameAs line in the body', () => {
    const source = ['---', "title: 'A'", '---', 'sameAs: text'].join('\n');
    expect(withAmenities(source, ['Playground'])).toBe(
      [
        '---',
        "title: 'A'",
        'amenities:',
        '  - Playground',
        '---',
        'sameAs: text',
      ].join('\n')
    );
  });
});
