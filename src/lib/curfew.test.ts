/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { curfewOf } from './curfew.js';
import {
  baseMeta,
  egyptPark,
  highFalls,
  mendonPonds,
  westHigh,
} from './place-fixtures.js';
import type { DayOfWeek, ParkMeta } from './types.js';

const EVERY_DAY: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

describe('curfewOf', () => {
  test('a county Park with no grounds hours gets the county curfew', () => {
    expect(curfewOf(mendonPonds)).toEqual({
      closed: 'Closed 10\u00a0p.m. to 6\u00a0a.m.',
      law: { name: 'county law', url: 'https://ecode360.com/11941689' },
    });
  });

  test('a county Park with grounds hours gets none: they show the close', () => {
    const webster: ParkMeta = {
      ...mendonPonds,
      openingHours: [{ dayOfWeek: EVERY_DAY, opens: '07:00', closes: '22:00' }],
    };
    expect(curfewOf(webster)).toBeUndefined();
  });

  test('a county Park with only Facility hours gets the curfew for its grounds', () => {
    const seneca: ParkMeta = {
      ...mendonPonds,
      facilities: [
        {
          name: 'Seneca Park Zoo',
          type: 'Zoo',
          openingHours: [
            { dayOfWeek: EVERY_DAY, opens: '10:00', closes: '17:00' },
          ],
        },
      ],
    };
    expect(curfewOf(seneca)?.closed).toBe('Closed 10\u00a0p.m. to 6\u00a0a.m.');
  });

  test.each([
    ['a city Park', westHigh],
    ['a town Park', egyptPark],
    ['a state Park', highFalls],
    [
      'a Trail inside a county Park',
      {
        ...baseMeta,
        section: {
          title: 'Abraham Lincoln Park',
          url: '/monroe-county-parks/abraham-lincoln-park/',
        },
      },
    ],
  ])('%s gets none', (_, meta) => {
    expect(curfewOf(meta)).toBeUndefined();
  });
});
