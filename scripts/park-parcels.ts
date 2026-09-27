/**
 * Picks the tax parcels that make up a Park's grounds, for a Park with no
 * county Park-boundary polygon (scripts/park-outlines.ts). Pure choice logic,
 * with no network calls and no geometry maths of its own: it reads whatever
 * an injected `ParcelSource` reports, so it can be tested with fixtures.
 *
 * The seed, tried in order (#300):
 *   1. The park-type parcel under the Park's point.
 *   2. The parcel under the point of any other class, when two signals
 *      agree: the page address, a City owner name that holds the Park's
 *      name, the City's O-S Open Space zoning at the point, or acres within
 *      15% of the page's. The same street counts as the page address when
 *      either side has no number. A house or apartment lot never counts its
 *      acres.
 *      One signal is not enough: a page address alone gives a firehouse or
 *      a police station (#292).
 *   3. The nearest park-type parcel within 60 m.
 *
 * From the seed, add any touching parcel that is also park-type and in the
 * same municipality (`swis`) as the seed; repeat until nothing new joins. A
 * city parcel carries no `swis`, so every touching city parcel joins
 * regardless of municipality. Growth never takes another Park's seed, nor a
 * parcel that pushes the total past 2.5 times the page acres, and a seed of
 * rule 2 whose acres already agree does not grow. Finally, when the page
 * gives `acres`, the joined parcels must total within a factor of 2.5 of
 * it, or the pick is rejected as a likely mismatch.
 *
 * #300 measured each rule against the 98 hand picks, with `PICKS` off
 * (`MEASURE=1`, see scripts/park-outlines.ts). With no rule, 12 came out
 * right. Each rule turned off alone loses: rule 2, 20 picks; its O-S
 * signal, 2; the stop at another Park's seed, 2; the acres cap, 2; no
 * growth for a rule-2 seed, 1. Together: 39, and no outline the search drew
 * before changed. Three rules reproduced no pick and were dropped: a seed
 * search to 400 m ranked by address, and growth into a touching parcel with
 * the seed's address or with the Park's name in its City owner name.
 */

export type Point = [number, number];
export type Ring = Point[];
/** A polygon: the outer ring first, then any holes. */
export type Poly = Ring[];

/** A tax or county-park parcel, as a `ParcelSource` reports it. */
export interface ParcelFeature {
  id: string;
  /** Whether the parcel's class marks it as park land. */
  parkType: boolean;
  /** The parcel's municipality (`swis`). Absent for a city parcel. */
  swis?: string;
  acres: number;
  geometry: Poly[];
  /** The tax class code, such as 311 for vacant residential land. */
  classCode?: number;
  /** Class and description, for a report line when the Park gets no outline. */
  description?: string;
  /**
   * A City-owned parcel's owner name. The county layer has no owner field,
   * so the owner-name signal works only for a city Park.
   */
  owner?: string;
  address?: ParcelAddress;
}

/** A parcel's site address. A vacant lot often has a street and no number. */
export interface ParcelAddress {
  number?: string;
  street: string;
}

/** What a Park's own page says about it. */
export interface ParkFacts {
  latitude: number;
  longitude: number;
  acres?: number;
  /** The page's `address.streetAddress`. */
  address?: string;
  /** The page's title. */
  name?: string;
}

/** How far, in metres, the seed parcel is allowed to sit from the point. */
export const SEED_DISTANCE = 60;

/** How far a parcel's acres may sit from the page's and still agree. */
export const ACRES_AGREE = 0.15;

/** How far a joined parcel's acres may sit from the Park's own figure. */
export const ACRES_FACTOR = 2.5;

/** Where a Park's parcels can be looked up. Each call may hit the network. */
export interface ParcelSource {
  /**
   * Whether `swis` means anything for this source. The city layer carries no
   * `swis` at all, by design, so it never applies the same-municipality rule;
   * a county-style source does, so a seed missing `swis` there is a data gap,
   * not permission to join everything.
   */
  hasSwis: boolean;
  /** Every parcel under the point, park-type or not. */
  containing(point: { latitude: number; longitude: number }): Promise<
    ParcelFeature[]
  >;
  /** Park-type parcels within `metres` of the point, nearest first. */
  near(
    point: { latitude: number; longitude: number },
    metres: number
  ): Promise<ParcelFeature[]>;
  /** Parcels touching the union of `features`, park-type or not. */
  touching(features: ParcelFeature[]): Promise<ParcelFeature[]>;
  /**
   * Whether the point is in an O-S Open Space zoning district. Only the
   * City has a zoning layer, so a county-style source leaves this out.
   */
  openSpace?(point: { latitude: number; longitude: number }): Promise<boolean>;
}

/** A successful pick. `via` says whether the seed sat under the point. */
export interface ParcelPick {
  ids: string[];
  geometry: Poly[];
  acres: number;
  via: 'on' | 'near';
}

/** A pick that failed, with what evidence there is for the report. */
export interface ParcelMiss {
  reason: string;
  /** What the point falls on instead, when it falls on anything. */
  evidence?: ParcelFeature;
  /** The joined parcels, when the acres check is what failed. */
  ids?: string[];
  acres?: number;
}

export type ParcelChoice = ParcelPick | ParcelMiss;

export function isMiss<T extends object>(choice: T | ParcelMiss): choice is ParcelMiss {
  return 'reason' in choice;
}

/** Growth rounds capped so a data error cannot loop forever. */
export const GROWTH_ROUNDS = 10;

/** The short form of each compass word, as parcel addresses write it. */
const DIRECTIONS: Record<string, string> = {
  north: 'n',
  south: 's',
  east: 'e',
  west: 'w',
};
/** Words a street name may end with that say nothing. */
const STREET_SUFFIXES = new Set(
  'st street rd road ave avenue av dr drive blvd boulevard ln lane pkwy parkway ter terrace cir circle ct court pl place way crs crescent trl trail hwy'.split(
    ' '
  )
);

function streetWords(street: string): string {
  const words = street
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => DIRECTIONS[word] ?? word);
  while (words.length > 1 && STREET_SUFFIXES.has(words[words.length - 1])) {
    words.pop();
  }
  return words.join(' ');
}

/**
 * Whether a page address names a parcel: `full` for the same number and
 * street, `street` for the same street when either side has no number. A
 * page address like "Harding Rd and Brewster" or "Adams St at Frederick
 * Douglass St" is read up to its first "and", "at", "&", "," or "(".
 */
export function addressMatch(
  pageAddress: string | undefined,
  parcel: ParcelAddress | undefined
): 'full' | 'street' | undefined {
  if (!pageAddress || !parcel?.street) return undefined;
  const first = pageAddress.split(/\s+(?:and|at|&)\s+|[,(]/i)[0].trim();
  const numbered = first.match(/^(\d+\S*)\s+(.*)$/);
  const number = numbered?.[1];
  const street = numbered ? numbered[2] : first;
  if (streetWords(street) !== streetWords(parcel.street)) return undefined;
  if (number && parcel.number) {
    return number.toLowerCase() === parcel.number.toLowerCase() ? 'full' : undefined;
  }
  return 'street';
}

/** Words in a Park's name that do not tell one Park from another. */
const NAME_WORDS = new Set(
  'the and of at a park parks square playground plaza mall green memorial city rochester roch'.split(' ')
);

/**
 * Whether a City owner name holds the Park's name: the first word of the
 * name that is not a generic word, as a whole word ("Cobbs" in "City Of Roch
 * Cobbs Hill Reserv" for Cobb's Hill Park).
 */
export function ownerNamesPark(owner: string | undefined, name: string | undefined): boolean {
  if (!owner || !name) return false;
  const words = (text: string) =>
    text.toLowerCase().replace(/['’.]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  const key = words(name).find((word) => word.length >= 3 && !NAME_WORDS.has(word));
  return key !== undefined && words(owner).includes(key);
}

function acresAgree(parcelAcres: number, parkAcres: number | undefined): boolean {
  return (
    parkAcres !== undefined &&
    Math.abs(parcelAcres - parkAcres) <= ACRES_AGREE * parkAcres
  );
}

/** A house or apartment lot, whose acres alone say nothing about a Park. */
function isHome(feature: ParcelFeature): boolean {
  const code = feature.classCode ?? 0;
  return (code >= 200 && code < 300) || code === 411;
}

/** How many independent signals tie a parcel to the Park's page. */
function signals(feature: ParcelFeature, park: ParkFacts, openSpace: boolean): number {
  let count = openSpace ? 1 : 0;
  if (addressMatch(park.address, feature.address)) count++;
  if (ownerNamesPark(feature.owner, park.name)) count++;
  if (!isHome(feature) && acresAgree(feature.acres, park.acres)) count++;
  return count;
}

export interface Seed {
  feature: ParcelFeature;
  via: 'on' | 'near';
}

/** The parcel a Park's outline grows from; see the rules at the top. */
export async function chooseSeed(
  park: ParkFacts,
  source: ParcelSource
): Promise<Seed | ParcelMiss> {
  const under = await source.containing(park);
  const onPark = under.find((f) => f.parkType);
  if (onPark) return { feature: onPark, via: 'on' };
  if (under.length > 0) {
    const openSpace = (await source.openSpace?.(park)) ?? false;
    const agreed = under.find((f) => signals(f, park, openSpace) >= 2);
    if (agreed) return { feature: agreed, via: 'on' };
  }

  const nearby = await source.near(park, SEED_DISTANCE);
  if (nearby[0]) return { feature: nearby[0], via: 'near' };
  return {
    reason: 'no park-type parcel near the point',
    evidence: under[0],
  };
}

function byId(a: ParcelFeature, b: ParcelFeature): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Picks a Park's parcels. `othersIds` holds the parcel ids of other Parks,
 * which growth never takes. `knownSeed` is the Park's `chooseSeed` result, when
 * the caller has it already.
 */
export async function chooseParcels(
  park: ParkFacts,
  source: ParcelSource,
  othersIds: ReadonlySet<string> = new Set(),
  knownSeed?: Seed | ParcelMiss
): Promise<ParcelChoice> {
  const seedChoice = knownSeed ?? (await chooseSeed(park, source));
  if (isMiss(seedChoice)) return seedChoice;
  const { feature: seed, via } = seedChoice;
  const parkAcres = park.acres;
  const maxAcres = parkAcres === undefined ? Infinity : parkAcres * ACRES_FACTOR;

  // A seed of another class that already has the page's acres is the whole
  // Park, so nothing joins it. A park-type seed with the page's acres still
  // grows: its neighbours are often the rest of a Park whose page counts
  // less land.
  const whole = !seed.parkType && acresAgree(seed.acres, parkAcres);
  const chosen = new Map<string, ParcelFeature>([[seed.id, seed]]);
  let total = seed.acres;
  // A county-style seed with no `swis` cannot be matched to any neighbour's
  // municipality, so it joins nothing rather than joining everything. The
  // city source sets `hasSwis: false` and skips this rule entirely.
  let stable = whole || (source.hasSwis && seed.swis === undefined);
  for (let round = 0; !stable && round < GROWTH_ROUNDS; round++) {
    const before = chosen.size;
    // By id, so the acres cap takes the same parcels on every run.
    const touching = (await source.touching([...chosen.values()])).sort(byId);
    for (const candidate of touching) {
      if (chosen.has(candidate.id) || othersIds.has(candidate.id)) continue;
      if (!candidate.parkType) continue;
      if (source.hasSwis && candidate.swis !== seed.swis) continue;
      if (total + candidate.acres > maxAcres) continue;
      chosen.set(candidate.id, candidate);
      total += candidate.acres;
    }
    if (chosen.size === before) stable = true;
  }
  if (!stable) {
    return { reason: `parcels kept growing past ${GROWTH_ROUNDS} rounds` };
  }

  // Sorted by id, not fetch order, so the joined geometry (and so the union
  // and simplify that follow) comes out the same on every run.
  const features = [...chosen.values()].sort(byId);
  const ids = features.map((f) => f.id);
  const acres = features.reduce((sum, f) => sum + f.acres, 0);

  if (parkAcres !== undefined) {
    const ratio = acres / parkAcres;
    if (ratio > ACRES_FACTOR || ratio < 1 / ACRES_FACTOR) {
      return {
        reason: "parcels much larger/smaller than the Park's acres",
        ids,
        acres,
      };
    }
  }

  return {
    ids,
    geometry: features.flatMap((f) => f.geometry),
    acres,
    via,
  };
}
