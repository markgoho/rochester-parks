/**
 * Adds the amenities that the official pages list to each Park's front
 * matter, through the canonical names in `docs/research/amenity-map.json`.
 * It keeps every amenity a Park has now. Run it again after a new crawl:
 *
 *   bun scripts/merge-amenities.ts
 *
 * It stops, and writes nothing, if a string from the crawl is not in the map.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import matter from 'gray-matter';
import {
  mapAmenities,
  mergeAmenities,
  withAmenities,
  type AmenityMap,
} from '../src/lib/amenities';

/** One Park from the crawl, with the amenities its own official page lists. */
interface CrawlRow {
  file: string;
  amenities: string[];
}

const { rows } = JSON.parse(
  readFileSync('docs/research/amenities-2026-09-18.json', 'utf8')
) as { rows: CrawlRow[] };
const { map } = JSON.parse(
  readFileSync('docs/research/amenity-map.json', 'utf8')
) as { map: AmenityMap };

const updates: { file: string; source: string }[] = [];
const unmapped = new Set<string>();

for (const row of rows) {
  const mapped = mapAmenities(row.amenities, map);
  mapped.unmapped.forEach((entry) => unmapped.add(entry));
  if (!mapped.names.length) continue;

  const source = readFileSync(row.file, 'utf8');
  const existing: string[] = matter(source).data.amenities ?? [];
  const merged = mergeAmenities(existing, mapped.names);
  // The merge only adds, so the same length means nothing new.
  if (merged.length === existing.length) continue;
  updates.push({ file: row.file, source: withAmenities(source, merged) });
}

if (unmapped.size) {
  console.error('Not in the amenity map:\n' + [...unmapped].join('\n'));
  process.exit(1);
}
for (const { file, source } of updates) writeFileSync(file, source);
console.log(`Updated ${updates.length} Park pages.`);
