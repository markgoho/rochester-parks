import type { Topic } from '#lib/types.js';

// `gfmHeadingId` (src/lib/server/content.ts) always renders a level-2
// heading as `<h2 id="...">text</h2>`, one per line, with no attribute
// other than `id` and no nested heading inside it.
const H2 = /<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g;

function textOf(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * The topics a Park page's navigation lists (ADR-0007): each `h2` in the
 * body, in document order, plus any `extra` topic built from front matter
 * (for example Facilities), appended after them in the order given.
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
  topics.push(...extra);
  return topics.length >= 2 ? topics : [];
}
