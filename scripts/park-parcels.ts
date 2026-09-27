/**
 * Picks the tax parcels that make up a Park's grounds, for a Park with no
 * county Park-boundary polygon (scripts/park-outlines.ts). Pure choice logic,
 * with no network calls and no geometry maths of its own: it reads whatever
 * an injected `ParcelSource` reports, so it can be tested with fixtures.
 *
 * The rule: the seed is the park-type parcel under the Park's point, or else
 * the nearest park-type parcel within 60 m. From the seed, add any touching
 * parcel that is also park-type and in the same municipality (`swis`) as the
 * seed; repeat until nothing new joins. A city parcel carries no `swis`, so
 * every touching city parcel joins regardless of municipality. Finally, when
 * the Park's own page gives `acres`, the joined parcels must total within a
 * factor of 2.5 of it, or the pick is rejected as a likely mismatch.
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
  /** Class and description, for a report line when the Park gets no outline. */
  description?: string;
  /** A City-owned parcel's owner name, for a report line. */
  owner?: string;
}

/** How far, in metres, the seed parcel is allowed to sit from the point. */
export const SEED_DISTANCE = 60;

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

export function isMiss(choice: ParcelChoice): choice is ParcelMiss {
  return 'reason' in choice;
}

/** Growth rounds capped so a data error cannot loop forever. */
export const GROWTH_ROUNDS = 10;

export async function chooseParcels(
  point: { latitude: number; longitude: number },
  parkAcres: number | undefined,
  source: ParcelSource
): Promise<ParcelChoice> {
  const under = await source.containing(point);
  let seed = under.find((f) => f.parkType);
  let via: 'on' | 'near' = 'on';

  if (!seed) {
    const nearby = await source.near(point, SEED_DISTANCE);
    seed = nearby[0];
    via = 'near';
  }
  if (!seed) {
    return {
      reason: 'no park-type parcel near the point',
      evidence: under[0],
    };
  }

  const chosen = new Map<string, ParcelFeature>([[seed.id, seed]]);
  // A county-style seed with no `swis` cannot be matched to any neighbour's
  // municipality, so it joins nothing rather than joining everything. The
  // city source sets `hasSwis: false` and skips this rule entirely.
  let stable = source.hasSwis && seed.swis === undefined;
  for (let round = 0; !stable && round < GROWTH_ROUNDS; round++) {
    const before = chosen.size;
    const touching = await source.touching([...chosen.values()]);
    for (const candidate of touching) {
      if (!candidate.parkType) continue;
      if (source.hasSwis && candidate.swis !== seed.swis) continue;
      chosen.set(candidate.id, candidate);
    }
    if (chosen.size === before) stable = true;
  }
  if (!stable) {
    return { reason: `parcels kept growing past ${GROWTH_ROUNDS} rounds` };
  }

  // Sorted by id, not fetch order, so the joined geometry (and so the union
  // and simplify that follow) comes out the same on every run.
  const features = [...chosen.values()].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );
  const ids = features.map((f) => f.id);
  const acres = features.reduce((total, f) => total + f.acres, 0);

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
