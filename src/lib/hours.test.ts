/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  facilitiesJsonLd,
  formatDate,
  formatHours,
  holidayDate,
  hoursJsonLd,
  hoursView,
  inEffect,
  nextChange,
  nextHolidayDate,
  seasonWindow,
} from './hours.js';
import type { DayOfWeek, Facility, OpeningHours } from './types.js';

const EVERY_DAY: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const sprayPark: OpeningHours = {
  dayOfWeek: EVERY_DAY,
  opens: 'dawn',
  closes: 'dusk',
  season: { from: 'Memorial Day', through: 'Labor Day' },
};

const rink: OpeningHours = {
  dayOfWeek: EVERY_DAY,
  opens: '12:00',
  closes: '20:50',
  season: { from: 'November 23', through: 'March 1' },
};

describe('holidayDate', () => {
  test('Memorial Day is the last Monday in May', () => {
    expect(holidayDate('Memorial Day', 2026)).toBe('2026-05-25');
    expect(holidayDate('Memorial Day', 2027)).toBe('2027-05-31');
  });

  test('Labor Day is the first Monday in September', () => {
    expect(holidayDate('Labor Day', 2026)).toBe('2026-09-07');
    expect(holidayDate('Labor Day', 2027)).toBe('2027-09-06');
  });

  test('Thanksgiving is the fourth Thursday in November', () => {
    expect(holidayDate('Thanksgiving', 2026)).toBe('2026-11-26');
    expect(holidayDate('Thanksgiving', 2027)).toBe('2027-11-25');
  });

  test('fixed-date holidays', () => {
    expect(holidayDate('Christmas', 2026)).toBe('2026-12-25');
    expect(holidayDate("New Year's Day", 2027)).toBe('2027-01-01');
  });
});

describe('nextHolidayDate', () => {
  test('is this year until the day has passed', () => {
    expect(nextHolidayDate('Thanksgiving', '2026-09-18')).toBe('2026-11-26');
    expect(nextHolidayDate('Thanksgiving', '2026-11-26')).toBe('2026-11-26');
    expect(nextHolidayDate('Thanksgiving', '2026-11-27')).toBe('2027-11-25');
  });
});

describe('seasonWindow', () => {
  test('a holiday season, in progress', () => {
    expect(seasonWindow(sprayPark.season!, '2026-07-01')).toEqual({
      from: '2026-05-25',
      through: '2026-09-07',
    });
  });

  test('a holiday season, over for the year, gives next year', () => {
    expect(seasonWindow(sprayPark.season!, '2026-09-18')).toEqual({
      from: '2027-05-31',
      through: '2027-09-06',
    });
  });

  test('a month-and-day season', () => {
    const season = { from: 'April 1', through: 'October 31' };
    expect(seasonWindow(season, '2026-03-15')).toEqual({
      from: '2026-04-01',
      through: '2026-10-31',
    });
  });

  test('a season that crosses the new year', () => {
    expect(seasonWindow(rink.season!, '2026-09-18')).toEqual({
      from: '2026-11-23',
      through: '2027-03-01',
    });
    expect(seasonWindow(rink.season!, '2027-01-10')).toEqual({
      from: '2026-11-23',
      through: '2027-03-01',
    });
  });
});

describe('inEffect', () => {
  test('an entry with no window is always in effect', () => {
    const grounds = { dayOfWeek: EVERY_DAY, opens: 'dawn', closes: 'dusk' };
    expect(inEffect([grounds], '2026-09-18')).toEqual([grounds]);
  });

  test('a season, in and out', () => {
    expect(inEffect([sprayPark], '2026-07-04')).toEqual([sprayPark]);
    expect(inEffect([sprayPark], '2026-09-08')).toEqual([]);
  });

  test('a season across the new year', () => {
    expect(inEffect([rink], '2027-01-10')).toEqual([rink]);
    expect(inEffect([rink], '2027-03-02')).toEqual([]);
  });

  test('before validFrom, and after validThrough', () => {
    const summer = { ...rink, season: undefined, validFrom: '2026-11-23' };
    expect(inEffect([summer], '2026-11-22')).toEqual([]);
    expect(inEffect([summer], '2026-11-23')).toEqual([summer]);
    const ended = { ...rink, season: undefined, validThrough: '2026-09-01' };
    expect(inEffect([ended], '2026-09-01')).toEqual([ended]);
    expect(inEffect([ended], '2026-09-02')).toEqual([]);
  });
});

describe('nextChange', () => {
  test('no window means no change', () => {
    const grounds = { dayOfWeek: EVERY_DAY, opens: 'dawn', closes: 'dusk' };
    expect(nextChange([grounds], '2026-09-18')).toBeUndefined();
  });

  test('closed for the season: opens on the next Memorial Day', () => {
    expect(nextChange([sprayPark], '2026-09-18')).toEqual({
      date: '2027-05-31',
      entries: [sprayPark],
    });
  });

  test('in season: closes the day after Labor Day', () => {
    expect(nextChange([sprayPark], '2026-07-04')).toEqual({
      date: '2026-09-08',
      entries: [],
    });
  });

  test('a month-and-day season opens on its first day', () => {
    const spring = {
      ...rink,
      season: { from: 'April 1', through: 'October 31' },
    };
    expect(nextChange([spring], '2026-11-15')).toEqual({
      date: '2027-04-01',
      entries: [spring],
    });
  });

  test('a season across the new year ends in March', () => {
    expect(nextChange([rink], '2027-01-10')).toEqual({
      date: '2027-03-02',
      entries: [],
    });
  });

  test('before validFrom, and until after validThrough', () => {
    const from = { ...rink, season: undefined, validFrom: '2026-11-23' };
    expect(nextChange([from], '2026-09-18')).toEqual({
      date: '2026-11-23',
      entries: [from],
    });
    const through = { ...rink, season: undefined, validThrough: '2026-10-01' };
    expect(nextChange([through], '2026-09-18')).toEqual({
      date: '2026-10-02',
      entries: [],
    });
    expect(nextChange([through], '2026-10-02')).toBeUndefined();
  });

  test('one set of hours hands over to the next', () => {
    const summer = { ...rink, validThrough: '2026-10-31', season: undefined };
    const winter = { ...rink, validFrom: '2026-11-01', season: undefined };
    expect(nextChange([summer, winter], '2026-09-18')).toEqual({
      date: '2026-11-01',
      entries: [winter],
    });
  });
});

describe('formatDate', () => {
  test('uses AP month names', () => {
    expect(formatDate('2026-09-18')).toBe('Sept 18, 2026');
    expect(formatDate('2027-05-31')).toBe('May 31, 2027');
    expect(formatDate('2026-11-23', { year: false })).toBe('Nov 23');
  });
});

describe('formatHours', () => {
  test('sun words stay words', () => {
    const grounds = { dayOfWeek: EVERY_DAY, opens: 'dawn', closes: 'dusk' };
    expect(formatHours([grounds])).toEqual(['Dawn to dusk daily']);
    const sunset = { dayOfWeek: EVERY_DAY, opens: '07:00', closes: 'sunset' };
    expect(formatHours([sunset])).toEqual(['7 a.m. to sunset daily']);
  });

  test('clock times', () => {
    const day = { dayOfWeek: EVERY_DAY, opens: '07:00', closes: '22:00' };
    expect(formatHours([day])).toEqual(['7 a.m. – 10 p.m. daily']);
    const week: OpeningHours = {
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
      opens: '08:30',
      closes: '19:30',
    };
    expect(formatHours([week])).toEqual(['Mon – Thu 8:30 a.m. – 7:30 p.m.']);
    const some: OpeningHours = {
      dayOfWeek: ['Monday', 'Thursday', 'Friday'],
      opens: '12:00',
      closes: '17:30',
    };
    expect(formatHours([some])).toEqual(['Mon, Thu, Fri noon – 5:30 p.m.']);
  });

  test('a closing time alone', () => {
    const late = { dayOfWeek: EVERY_DAY, closes: 'dusk' };
    expect(formatHours([late])).toEqual(['Closes at dusk daily']);
  });

  test('a season with no times', () => {
    expect(formatHours([{ dayOfWeek: EVERY_DAY }])).toEqual(['Open daily']);
  });
});

describe('hoursView', () => {
  test('closed for the season, with the day it opens', () => {
    expect(hoursView([sprayPark], [], '2026-09-18')).toEqual({
      lines: ['Closed for the season'],
      note: 'Opens Memorial Day (May 31, 2027), dawn to dusk daily',
      closedOn: undefined,
    });
  });

  test('in season, with the day it closes', () => {
    expect(hoursView([sprayPark], [], '2026-07-04')).toEqual({
      lines: ['Dawn to dusk daily'],
      note: 'Closed for the season after Labor Day (Sept 7)',
      closedOn: undefined,
    });
  });

  test('closed until a date', () => {
    const from = { ...rink, season: undefined, validFrom: '2026-11-23' };
    expect(hoursView([from], ['Thanksgiving'], '2026-09-18')).toEqual({
      lines: ['Closed'],
      note: 'Opens Nov 23, noon – 8:50 p.m. daily',
      closedOn: 'Closed Thanksgiving',
    });
  });

  test('a season with no times names only the day it opens', () => {
    const open = { dayOfWeek: EVERY_DAY, season: sprayPark.season };
    expect(hoursView([open], [], '2026-09-18')?.note).toBe(
      'Opens Memorial Day (May 31, 2027)'
    );
  });

  test('no hours', () => {
    expect(hoursView([], [], '2026-09-18')).toBeUndefined();
  });
});

describe('facilitiesJsonLd', () => {
  const rinkFacility: Facility = {
    name: 'Ice rink',
    type: 'IceSkatingRink',
    openingHours: [rink],
  };

  const lodge: Facility = {
    name: 'Canal Days Lodge',
    type: 'EventVenue',
    rental: {
      email: 'recreation@ogdenny.com',
      phone: '(585) 617-6174',
      season: 'Early May to early October',
    },
  };

  test('a Facility with hours keeps them', () => {
    const [place] = facilitiesJsonLd([rinkFacility], '2026-09-18') as {
      openingHoursSpecification: object[];
    }[];
    expect(place.openingHoursSpecification).toHaveLength(1);
  });

  test('a rented Facility with no hours names no hours at all', () => {
    const [place] = facilitiesJsonLd([lodge], '2026-09-18');
    expect(place).not.toHaveProperty('openingHoursSpecification');
    expect(place).not.toHaveProperty('specialOpeningHoursSpecification');
  });

  test('a rented Facility gives the way to book it', () => {
    expect(facilitiesJsonLd([lodge], '2026-09-18')).toEqual([
      {
        '@type': 'EventVenue',
        name: 'Canal Days Lodge',
        geo: undefined,
        url: undefined,
        email: 'recreation@ogdenny.com',
        telephone: '(585) 617-6174',
      },
    ]);
  });

  test('a Facility with a place of its own gives its coordinates', () => {
    const placed: Facility = {
      ...lodge,
      geo: { latitude: 43.1985112, longitude: -77.8044681 },
    };
    const [place] = facilitiesJsonLd([placed], '2026-09-18');
    expect(place).toMatchObject({
      geo: {
        '@type': 'GeoCoordinates',
        latitude: 43.1985112,
        longitude: -77.8044681,
      },
    });
  });

  test('a season a Facility is rented in is never a season of hours', () => {
    const [place] = facilitiesJsonLd([lodge], '2026-09-18');
    expect(JSON.stringify(place)).not.toContain('Early May');
  });
});

describe('hoursJsonLd', () => {
  test('leaves out every entry with a sun word', () => {
    const half = { dayOfWeek: EVERY_DAY, opens: '07:00', closes: 'sunset' };
    expect(hoursJsonLd([half], [], '2026-09-18')).toEqual({
      openingHoursSpecification: [],
      specialOpeningHoursSpecification: [],
    });
  });

  test('clock times, with the real dates of a season', () => {
    const pool = { ...sprayPark, opens: '11:00', closes: '18:45' };
    expect(
      hoursJsonLd([pool], [], '2026-09-18').openingHoursSpecification
    ).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: EVERY_DAY.map((day) => `https://schema.org/${day}`),
        opens: '11:00',
        closes: '18:45',
        validFrom: '2027-05-31',
        validThrough: '2027-09-06',
      },
    ]);
  });

  test('leaves out a window that has ended', () => {
    const ended = { ...rink, season: undefined, validThrough: '2026-09-01' };
    expect(
      hoursJsonLd([ended], [], '2026-09-18').openingHoursSpecification
    ).toEqual([]);
  });

  test('holidays close all day on their next date', () => {
    expect(
      hoursJsonLd([], ['Thanksgiving', "New Year's Day"], '2026-09-18')
        .specialOpeningHoursSpecification
    ).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        opens: '00:00',
        closes: '00:00',
        validFrom: '2026-11-26',
        validThrough: '2026-11-26',
      },
      {
        '@type': 'OpeningHoursSpecification',
        opens: '00:00',
        closes: '00:00',
        validFrom: '2027-01-01',
        validThrough: '2027-01-01',
      },
    ]);
  });
});
