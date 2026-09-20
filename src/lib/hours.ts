import type {
  DayOfWeek,
  Facility,
  Holiday,
  HoursView,
  OpeningHours,
  SeasonEnd,
  SunWord,
} from './types.js';

// Opening hours, resolved against a date. Every function takes the date as
// an ISO string, so the build can pass the day it runs and a test can pass
// any day it likes. Dates are compared as ISO strings, which sort in order,
// and built in UTC, so no local clock or daylight saving gets involved.

/** The calendar day in Rochester when the build runs. */
export function buildDate(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
  }).format(now);
}

function iso(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return iso(year, month, day + days);
}

/**
 * The nth given weekday of a month, where Sunday is 0. A negative n counts
 * from the end, so -1 is the last one.
 */
function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number
): string {
  if (n > 0) {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return iso(year, month, 1 + ((weekday - first + 7) % 7) + (n - 1) * 7);
  }
  const lastDay = new Date(Date.UTC(year, month, 0));
  const offset = (lastDay.getUTCDay() - weekday + 7) % 7;
  return iso(year, month, lastDay.getUTCDate() - offset + (n + 1) * 7);
}

const HOLIDAYS: Record<Holiday, (year: number) => string> = {
  "New Year's Day": (year) => iso(year, 1, 1),
  'Martin Luther King Jr. Day': (year) => nthWeekday(year, 1, 1, 3),
  "Presidents' Day": (year) => nthWeekday(year, 2, 1, 3),
  'Memorial Day': (year) => nthWeekday(year, 5, 1, -1),
  Juneteenth: (year) => iso(year, 6, 19),
  'Independence Day': (year) => iso(year, 7, 4),
  'Labor Day': (year) => nthWeekday(year, 9, 1, 1),
  'Columbus Day': (year) => nthWeekday(year, 10, 1, 2),
  'Veterans Day': (year) => iso(year, 11, 11),
  Thanksgiving: (year) => nthWeekday(year, 11, 4, 4),
  'Christmas Eve': (year) => iso(year, 12, 24),
  Christmas: (year) => iso(year, 12, 25),
  "New Year's Eve": (year) => iso(year, 12, 31),
};

function isHoliday(name: string): name is Holiday {
  return Object.hasOwn(HOLIDAYS, name);
}

export function holidayDate(name: Holiday, year: number): string {
  return HOLIDAYS[name](year);
}

/** The holiday's date on or after `today`. */
export function nextHolidayDate(name: Holiday, today: string): string {
  const date = holidayDate(name, yearOf(today));
  return date >= today ? date : holidayDate(name, yearOf(today) + 1);
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * A season end in a given year. A typo in the front matter fails the build
 * rather than quietly dropping a season.
 */
function seasonEndDate(end: SeasonEnd, year: number): string {
  if (isHoliday(end)) return holidayDate(end, year);
  const match = end.match(/^([A-Z][a-z]+) (\d{1,2})$/);
  const month = match ? MONTHS.indexOf(match[1]) + 1 : 0;
  if (!match || month === 0) {
    throw new Error(`Not a holiday or a month and day: "${end}"`);
  }
  return iso(year, month, Number(match[2]));
}

/**
 * The real dates of a season that is in progress on `today`, or else the
 * next one. A season whose end comes before its start in the calendar, like
 * a winter rink, runs across the new year.
 */
export function seasonWindow(
  season: { from: SeasonEnd; through: SeasonEnd },
  today: string
): { from: string; through: string } {
  const year = yearOf(today);
  let window = { from: '', through: '' };
  for (const start of [year - 1, year, year + 1]) {
    const from = seasonEndDate(season.from, start);
    let through = seasonEndDate(season.through, start);
    if (through < from) through = seasonEndDate(season.through, start + 1);
    window = { from, through };
    if (through >= today) break;
  }
  return window;
}

/** The dates an entry applies between, as far as it has any. */
function windowOf(
  entry: OpeningHours,
  today: string
): { from?: string; through?: string } {
  if (entry.season) return seasonWindow(entry.season, today);
  return { from: entry.validFrom, through: entry.validThrough };
}

/** The entries whose season or date window holds `today`. */
export function inEffect(
  entries: OpeningHours[],
  today: string
): OpeningHours[] {
  return entries.filter((entry) => {
    const { from, through } = windowOf(entry, today);
    return (!from || from <= today) && (!through || today <= through);
  });
}

/**
 * The first day after `today` on which a different set of entries applies,
 * and that set. Undefined when nothing will change.
 */
export function nextChange(
  entries: OpeningHours[],
  today: string
): { date: string; entries: OpeningHours[] } | undefined {
  const dates: string[] = [];
  for (const entry of entries) {
    const { from, through } = windowOf(entry, today);
    if (from && from > today) dates.push(from);
    if (through && through >= today) dates.push(addDays(through, 1));
  }
  if (!dates.length) return undefined;
  const date = dates.sort()[0];
  return { date, entries: inEffect(entries, date) };
}

// AP style, the way a newspaper prints a date: "Sept 18", not "Sep 18".
const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'March',
  'April',
  'May',
  'June',
  'July',
  'Aug',
  'Sept',
  'Oct',
  'Nov',
  'Dec',
];

export function formatDate(date: string, { year = true } = {}): string {
  const [y, month, day] = date.split('-').map(Number);
  const short = `${SHORT_MONTHS[month - 1]} ${day}`;
  return year ? `${short}, ${y}` : short;
}

const SUN_WORDS: ReadonlySet<string> = new Set<SunWord>([
  'dawn',
  'sunrise',
  'sunset',
  'dusk',
]);

function isClock(time: string | undefined): time is string {
  return time !== undefined && /^\d{2}:\d{2}$/.test(time);
}

/** 'HH:MM' or a sun word: the two things an opening or closing time can be. */
export function isTime(time: string): boolean {
  return isClock(time) || SUN_WORDS.has(time);
}

/** "7 a.m.", "8:30 p.m.", "noon", or the sun word as written. */
function formatTime(time: string): string {
  if (!isClock(time)) return time;
  const [hours, minutes] = time.split(':').map(Number);
  if (minutes === 0 && hours === 12) return 'noon';
  if (minutes === 0 && hours % 24 === 0) return 'midnight';
  const hour = hours % 12 || 12;
  const clock = minutes ? `${hour}:${String(minutes).padStart(2, '0')}` : hour;
  return `${clock} ${hours < 12 ? 'a.m.' : 'p.m.'}`;
}

/** A dash between two clock times, "to" when the sun sets either end. */
function formatRange({ opens, closes }: OpeningHours): string {
  if (!opens && !closes) return 'open';
  if (!opens) return `closes at ${formatTime(closes ?? '')}`;
  if (!closes) return `opens at ${formatTime(opens)}`;
  const joiner = SUN_WORDS.has(opens) || SUN_WORDS.has(closes) ? ' to ' : ' – ';
  return `${formatTime(opens)}${joiner}${formatTime(closes)}`;
}

const WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/** "daily", "Mon – Thu", or "Mon, Wed, Fri". */
function formatDays(days: DayOfWeek[]): string {
  const indexes = [...new Set(days.map((day) => WEEK.indexOf(day)))].sort(
    (a, b) => a - b
  );
  if (indexes.length === 7) return 'daily';
  const short = (index: number) => WEEK[index].slice(0, 3);
  const run = indexes.every(
    (index, i) => i === 0 || index === indexes[i - 1] + 1
  );
  if (run && indexes.length >= 3) {
    return `${short(indexes[0])} – ${short(indexes[indexes.length - 1])}`;
  }
  return indexes.map(short).join(', ');
}

/** One entry in lower case, for the middle of a sentence. */
function phrase(entry: OpeningHours): string {
  const days = formatDays(entry.dayOfWeek);
  const range = formatRange(entry);
  return days === 'daily' ? `${range} daily` : `${days} ${range}`;
}

function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** One line per entry, in the house style. */
export function formatHours(entries: OpeningHours[]): string[] {
  return entries.map((entry) => capitalise(phrase(entry)));
}

/** "a, b and c". */
function listOf(items: string[]): string {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

/**
 * A date as the reader wants it: named after the holiday that sets it when a
 * season does, with the year only when it is not this year.
 */
function dateLabel(
  date: string,
  entries: OpeningHours[],
  today: string,
  end: 'from' | 'through'
): string {
  const plain = formatDate(date, { year: yearOf(date) !== yearOf(today) });
  for (const entry of entries) {
    if (!entry.season) continue;
    const name = entry.season[end];
    const window = seasonWindow(entry.season, end === 'from' ? date : today);
    if (isHoliday(name) && window[end] === date) return `${name} (${plain})`;
  }
  return plain;
}

/**
 * The hours in effect on `today`, and the next change. Undefined when there
 * is nothing to say.
 */
export function hoursView(
  entries: OpeningHours[],
  closedOn: Holiday[],
  today: string
): HoursView | undefined {
  if (!entries.length && !closedOn.length) return undefined;
  const current = inEffect(entries, today);
  const change = nextChange(entries, today);
  const seasonal = entries.some((entry) => entry.season);
  const closed = seasonal ? 'Closed for the season' : 'Closed';
  let note: string | undefined;
  if (change && !current.length) {
    const when = dateLabel(change.date, entries, today, 'from');
    const times = change.entries.filter((entry) => entry.opens || entry.closes);
    note = times.length
      ? `Opens ${when}, ${times.map(phrase).join('; ')}`
      : `Opens ${when}`;
  } else if (change && !change.entries.length) {
    const last = addDays(change.date, -1);
    note = `${closed} after ${dateLabel(last, entries, today, 'through')}`;
  } else if (change) {
    const when = dateLabel(change.date, entries, today, 'from');
    note = `From ${when}: ${change.entries.map(phrase).join('; ')}`;
  }
  return {
    lines: current.length
      ? formatHours(current)
      : entries.length
        ? [closed]
        : [],
    note,
    closedOn: closedOn.length ? `Closed ${listOf(closedOn)}` : undefined,
  };
}

/**
 * The schema.org hours for one place. schema.org and Google take only clock
 * times, and a fixed time for dusk would be wrong most of the year, so an
 * entry with a sun word at either end is left out whole.
 */
export function hoursJsonLd(
  entries: OpeningHours[],
  closedOn: Holiday[],
  today: string
): {
  openingHoursSpecification: object[];
  specialOpeningHoursSpecification: object[];
} {
  return {
    openingHoursSpecification: entries.flatMap((entry) => {
      if (!isClock(entry.opens) || !isClock(entry.closes)) return [];
      const { from, through } = windowOf(entry, today);
      if (through && through < today) return [];
      return [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: entry.dayOfWeek.map((day) => `https://schema.org/${day}`),
          opens: entry.opens,
          closes: entry.closes,
          validFrom: from,
          validThrough: through,
        },
      ];
    }),
    // Closed all day is opens and closes both at midnight.
    specialOpeningHoursSpecification: closedOn.map((name) => {
      const date = nextHolidayDate(name, today);
      return {
        '@type': 'OpeningHoursSpecification',
        opens: '00:00',
        closes: '00:00',
        validFrom: date,
        validThrough: date,
      };
    }),
  };
}

/**
 * Each Facility as a place of its own, with the same rules for its hours. A
 * Facility that the public rents keeps no hours, and an empty hours
 * specification would say it never opens, so the hours are left out whole.
 */
export function facilitiesJsonLd(
  facilities: Facility[],
  today: string
): object[] {
  return facilities.map((facility) => ({
    '@type': facility.type,
    name: facility.name,
    geo: facility.geo && { '@type': 'GeoCoordinates', ...facility.geo },
    url: facility.rental?.url,
    telephone: facility.rental?.phone,
    ...(facility.openingHours?.length || facility.closedOn?.length
      ? hoursJsonLd(facility.openingHours ?? [], facility.closedOn ?? [], today)
      : {}),
  }));
}
