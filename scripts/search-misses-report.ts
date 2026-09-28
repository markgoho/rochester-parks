/**
 * Turns pages of the Pirsch `event/list` response into the sorted
 * no-result-term report (#319). Pure: no network, no `.env`, no `bun`
 * globals, so it is tested with fixtures shaped exactly as the docs show
 * (docs/research/search-analytics.md).
 */

/** One row of `GET /api/v1/statistics/event/list`. */
export interface EventRow {
  name: string;
  /** Pirsch stores every meta value as a string; the fixtures may still
   * pass a number, since a page-view count often looks numeric first. */
  meta: Record<string, string | number>;
  visitors: number;
  count: number;
}

export interface SearchMiss {
  term: string;
  count: number;
}

/**
 * @param pages Each page as the API returned it, in request order.
 * @returns The no-result terms, most first, ties broken alphabetically.
 */
export function pagesToMisses(pages: EventRow[][]): SearchMiss[] {
  const counts = new Map<string, number>();
  for (const page of pages) {
    for (const row of page) {
      const term = row.meta.term;
      if (typeof term !== 'string' || !term) continue;
      counts.set(term, (counts.get(term) ?? 0) + row.count);
    }
  }
  return [...counts.entries()]
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term));
}
