import type { Topic } from '#lib/types.js';

/**
 * The Facilities topic (ADR-0007, #77): built from front matter, not a
 * heading in the markdown body, so its id and title live here once and
 * `ParkSingle.svelte`'s `<section id>`/`<h2>` reads them rather than
 * repeating the strings.
 */
export const FACILITIES_TOPIC: Topic = {
  id: 'facilities',
  title: 'Facilities',
};

// `gfmHeadingId` (src/lib/server/content.ts) always renders a level-2
// heading as `<h2 id="...">text</h2>`, one per line, with no attribute
// other than `id` and no nested heading inside it.
const H2 = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;

// marked escapes heading text with exactly these five entities (its own
// `escape()` helper), so a topic's title has to decode them back.
const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => ENTITIES[entity])
    .trim();
}

/**
 * The topics a Park page's navigation lists (ADR-0007): each `h2` in the
 * body, in document order, plus any `extra` topic built from front matter
 * (for example Facilities), appended after them in the order given. A topic
 * already listed by its `id` (a body heading and an `extra` entry naming the
 * same anchor) is not repeated.
 *
 * ADR-0007 shows the navigation only "when it has two or more topic
 * headings", so this returns an empty list below that count. A caller only
 * has to check whether the result is non-empty.
 */
export function topicsOf(html: string, extra: Topic[] = []): Topic[] {
  const topics: Topic[] = [...html.matchAll(H2)].map(([, id, inner]) => ({
    id,
    title: textOf(inner),
  }));
  const seen = new Set(topics.map((topic) => topic.id));
  for (const topic of extra) {
    if (seen.has(topic.id)) continue;
    seen.add(topic.id);
    topics.push(topic);
  }
  return topics.length >= 2 ? topics : [];
}
