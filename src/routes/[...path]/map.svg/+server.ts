import { error } from '@sveltejs/kit';
import { searchEntryOf } from '#lib/search-index.js';
import { getAllUrls, getPage } from '#lib/server/content.js';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, '');

/** The place map a page's search result shows (#333), or undefined. The same
 * `searchEntryOf` the layouts read, so a file exists exactly where a page
 * flags one. */
const mapOf = (path: string) => {
  const page = getPage(path ? `/${path}/` : '/');
  return page && searchEntryOf(page).map;
};

export const entries: EntryGenerator = () =>
  getAllUrls()
    .map(trimSlashes)
    .filter((path) => mapOf(path))
    .map((path) => ({ path }));

export const GET: RequestHandler = ({ params }) => {
  const svg = mapOf(trimSlashes(params.path));
  if (!svg) error(404, 'Not found');
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
