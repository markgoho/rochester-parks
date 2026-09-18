// The source spells a few amenities two ways. Filtering only works if one
// thing has one name, so the variants collapse here rather than in the UI.
const AMENITY_ALIASES: Record<string, string> = {
  restrooms: 'Bathroom',
  'picnic area': 'Picnic Table',
};

export function normaliseAmenity(name: string): string {
  const trimmed = name.trim();
  return AMENITY_ALIASES[trimmed.toLowerCase()] ?? trimmed;
}

/**
 * Each amenity string as an official page prints it, trimmed and lowercased,
 * to the canonical names it gives. An empty list: not an amenity.
 */
export type AmenityMap = Record<string, string[]>;

/** The canonical names for an official page's strings, in first-seen order. */
export function mapAmenities(
  raw: string[],
  map: AmenityMap
): { names: string[]; unmapped: string[] } {
  const names = new Set<string>();
  const unmapped: string[] = [];
  for (const entry of raw) {
    const mapped = map[entry.trim().toLowerCase()];
    if (mapped) mapped.forEach((name) => names.add(name));
    else unmapped.push(entry);
  }
  return { names: [...names], unmapped };
}

/**
 * A Park's amenities with the new names added. Nothing the Park has is
 * dropped or respelled, and a name it already has under an alias is not
 * added a second time.
 */
export function mergeAmenities(existing: string[], added: string[]): string[] {
  const have = new Set(existing.map(normaliseAmenity));
  const merged = [...existing];
  for (const name of added) {
    const key = normaliseAmenity(name);
    if (have.has(key)) continue;
    have.add(key);
    merged.push(name);
  }
  return merged.sort((a, b) => a.localeCompare(b, 'en'));
}

/**
 * The page source with its front-matter `amenities` list set to `names`.
 * The rest of the file is kept byte for byte. A new list goes before
 * `sameAs`, or at the end of the front matter.
 */
export function withAmenities(source: string, names: string[]): string {
  const lines = source.split('\n');
  const end = lines.indexOf('---', 1);
  if (lines[0] !== '---' || end === -1) {
    throw new Error('The page has no front matter');
  }

  const start = lines.findIndex((line, i) => i < end && line === 'amenities:');
  let stop = start + 1;
  while (start !== -1 && stop < end && lines[stop].startsWith('  - ')) stop++;
  const quoted =
    start !== -1 &&
    lines.slice(start + 1, stop).some((line) => line.startsWith("  - '"));
  const block = [
    'amenities:',
    ...names.map((name) => (quoted ? `  - '${name}'` : `  - ${name}`)),
  ];

  if (start !== -1) {
    lines.splice(start, stop - start, ...block);
  } else {
    const sameAs = lines.findIndex((line, i) => i < end && line === 'sameAs:');
    lines.splice(sameAs === -1 ? end : sameAs, 0, ...block);
  }
  return lines.join('\n');
}
