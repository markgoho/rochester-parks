import { error } from '@sveltejs/kit';
import { getAllUrls, getPage } from '$lib/server/content';
import type { EntryGenerator, PageServerLoad } from './$types';

const trimSlashes = (path: string) => path.replace(/^\/+|\/+$/g, '');

export const entries: EntryGenerator = () =>
  getAllUrls().map((url) => ({ path: trimSlashes(url) }));

export const load: PageServerLoad = ({ params }) => {
  // With trailingSlash 'always', page requests get "about/" but data requests get "about".
  const path = trimSlashes(params.path);
  const page = getPage(path ? `/${path}/` : '/');
  if (!page) error(404, 'Not found');
  return page;
};
