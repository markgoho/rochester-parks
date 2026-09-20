export type Layout =
  | 'home'
  | 'default-list'
  | 'default-single'
  | 'park-list'
  | 'park-single';

export interface PageLink {
  title: string;
  url: string;
}

/**
 * What the site can honestly say about a park, derived from its own content.
 * Nothing here is authored by hand; all three flags follow from the markdown.
 */
export interface ParkStatus {
  /** A write-up of WRITTEN_WORD_FLOOR words or more. */
  written: boolean;
  /** An `amenities` list in the front matter. */
  inventoried: boolean;
  /** At least one image in the body. */
  photographed: boolean;
}

/** A postal address, as far as the front matter records one. */
export interface ParkAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
}

/**
 * An off-site page about a park. The front matter keeps these as a bare list
 * of URLs, so the label says what each one is.
 */
export interface ParkLink {
  url: string;
  label: string;
}

export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

/**
 * A time set by the sun, not the clock. Each is its own time: sunset comes
 * before dusk and dawn before sunrise, so the word the official page uses is
 * kept.
 */
export type SunWord = 'dawn' | 'sunrise' | 'sunset' | 'dusk';

/** A US holiday the build can turn into a date for any year. */
export type Holiday =
  | "New Year's Day"
  | 'Martin Luther King Jr. Day'
  | "Presidents' Day"
  | 'Memorial Day'
  | 'Juneteenth'
  | 'Independence Day'
  | 'Labor Day'
  | 'Columbus Day'
  | 'Veterans Day'
  | 'Thanksgiving'
  | 'Christmas Eve'
  | 'Christmas'
  | "New Year's Eve";

/**
 * One end of a season: a named holiday, or a month and day such as
 * 'April 21'. A season comes back each year.
 */
export type SeasonEnd = Holiday | string;

/**
 * One line of opening hours, in schema.org's names. `opens` is optional
 * because some official pages give only a closing time. An entry has either
 * a `season` or a `validFrom` / `validThrough` window, or neither.
 */
export interface OpeningHours {
  dayOfWeek: DayOfWeek[];
  /** 'HH:MM' or a sun word. */
  opens?: string;
  /** 'HH:MM' or a sun word. */
  closes?: string;
  season?: { from: SeasonEnd; through: SeasonEnd };
  /** ISO date. */
  validFrom?: string;
  /** ISO date. */
  validThrough?: string;
}

/** The schema.org types a Facility can take. */
export type FacilityType =
  | 'SportsActivityLocation'
  | 'EventVenue'
  | 'IceSkatingRink'
  | 'PublicSwimmingPool'
  | 'Zoo'
  | 'Beach'
  | 'Playground'
  | 'CivicStructure';

/**
 * How the public rents a Facility. A fee is not here on purpose: a fee changes
 * more often than the site is built, so the page gives the way to book and the
 * season, and the booking page gives the price. See `CONTEXT.md`.
 */
export interface FacilityRental {
  /** The page that takes a booking. */
  url?: string;
  /** The address that takes a booking by email. */
  email?: string;
  /** The telephone number that takes a booking, as the source prints it. */
  phone?: string;
  /**
   * The season the Facility is rented in, printed as the source gives it, for
   * example 'Early May to early October'. This is words, not a window: a
   * season of hours is a `from` and `through` pair the build turns into real
   * dates, and a source rarely dates a rental season that closely.
   */
  season?: string;
}

/**
 * A named place inside a Park that keeps its own hours, or that the public
 * rents. A rented Facility often has no public hours at all.
 */
export interface Facility {
  name: string;
  type: FacilityType;
  /** Absent when the Facility keeps no hours of its own. */
  openingHours?: OpeningHours[];
  closedOn?: Holiday[];
  /** Its own place inside the Park, so a map of the Park can show it. */
  geo?: { latitude: number; longitude: number };
  /** How the public rents it, when the public can. */
  rental?: FacilityRental;
}

/** Park facts a list or detail page can show without re-reading the markdown. */
export interface ParkMeta {
  /** Normalised amenity names, sorted. */
  amenities: string[];
  /** Body words, excluding embeds and image syntax. */
  wordCount: number;
  photoCount: number;
  /** The photo a park card shows, site-relative. Absent when there is none. */
  photo?: string;
  status: ParkStatus;
  /** Where the park is, when the front matter says. Used to plot it on a map. */
  geo?: { latitude: number; longitude: number };
  /** Park size in acres, when the front matter says. An authored fact. */
  acres?: number;
  /** Where the park is, in words. */
  address?: ParkAddress;
  /** Off-site pages about the park, labelled. Empty when there are none. */
  links: ParkLink[];
  /** Hours for the grounds, as the official page gives them. */
  openingHours?: OpeningHours[];
  /** Holidays the grounds close. */
  closedOn?: Holiday[];
  /** Places inside the Park that keep their own hours, or that the public rents. */
  facilities?: Facility[];
  /** ISO date the hours were last checked against the official page. */
  hoursCheckedOn?: string;
  /** The section a park belongs to, e.g. "Greece" or "Monroe County". */
  section: PageLink;
}

/** What the facts panel shows for one set of hours. */
export interface HoursView {
  /** The hours in effect today, one line each. */
  lines: string[];
  /** The next change, when one is coming. */
  note?: string;
  /** The holidays it closes. */
  closedOn?: string;
}

/** A Park's hours as the facts panel shows them. */
export interface ParkHours {
  /** Undefined when the grounds have no recorded hours. */
  grounds?: HoursView;
  facilities: (HoursView & { name: string })[];
  /** When the hours were last checked, as printed. */
  checkedOn?: string;
}

/** A child of a section. Parks carry their metadata so lists can show it. */
export interface ChildLink extends PageLink {
  park?: ParkMeta;
}

/** A rendered content page, as returned by the catch-all route's load. */
export interface Page extends PageLink {
  description: string;
  layout: Layout;
  /**
   * How `children` is ordered. Absent means by title, the default everywhere.
   * `'size'` marks the prerendered largest-first view of a park section.
   * `'neighborhood'` marks the city section's view grouped by Neighborhood.
   * Its `children` stay in title order; the layout groups them.
   */
  order?: 'size' | 'neighborhood';
  /**
   * How a park list shows its parks. Absent means the table. `'cards'` marks
   * the prerendered card view of an ordering, one level below it.
   */
  view?: 'cards';
  /**
   * On a park list, the section the parks belong to, named the short way.
   * A second ordering is still the same section, so the layout reads the
   * town, the place name and the link to the other ordering from here
   * rather than from its own URL.
   */
  section?: PageLink;
  /**
   * The page this one duplicates, when it is a second ordering of a section.
   * Search engines are told to prefer that page over this one.
   */
  canonical?: string;
  html: string;
  /** Child pages and sections, sorted by title. */
  children: ChildLink[];
  /** Home first, then each ancestor section. */
  ancestors: PageLink[];
  jsonLd: object[];
  /** Present on park pages only. */
  park?: ParkMeta;
  /** Present on park pages only: the hours, resolved against the build date. */
  hours?: ParkHours;
  /** Present on the home page only. */
  summary?: SiteSummary;
  /** The parks either side of this one in its section, by title. */
  neighbours?: { previous?: PageLink; next?: PageLink };
}

/** One row of the prerendered index the finder filters in the browser. */
export interface ParkIndexEntry extends PageLink {
  section: string;
  sectionUrl: string;
  amenities: string[];
  written: boolean;
  photographed: boolean;
  acres?: number;
}

/** Totals for the home page, so it never has to state a number by hand. */
export interface SiteSummary {
  parks: number;
  written: number;
  inventoried: number;
  photographed: number;
  amenities: { name: string; count: number }[];
  sections: { title: string; url: string; count: number }[];
}

/** What the finder needs, built once and served as static JSON. */
export interface ParkIndex {
  parks: ParkIndexEntry[];
  /** Every amenity in use, with how many parks record it, most common first. */
  amenities: { name: string; count: number }[];
  /** Every section with at least one park, most parks first. */
  sections: { title: string; url: string; count: number }[];
  /** Parks with no amenity list at all — the ones no filter can reach. */
  unreachable: number;
}
