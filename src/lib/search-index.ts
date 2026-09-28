import type { Layout } from './types.js';

/**
 * Whether a page belongs in the Pagefind index. This is the tracer bullet
 * (#318): only the Park page is in, and a Former Park stays out of it
 * (CONTEXT.md, ADR-0010, #297). A Trail page, a Blog post, About, a
 * "Trails" sub-page and a main Park List wait on a later ticket
 * (#319-#323), so they answer `false` here even though the spec (#317)
 * puts them in the index eventually.
 */
export function inSearchIndex({
  layout,
  former = false,
}: {
  layout: Layout;
  /** Whether the Park is a Former Park (`ParkMeta.former`). */
  former?: boolean;
}): boolean {
  return layout === 'park-single' && !former;
}
