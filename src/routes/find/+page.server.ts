import { getParkIndex } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const prerender = true;
// The one page that needs a client runtime: filtering happens in the browser
// against the prerendered index, so the rest of the site stays JS-free.
export const csr = true;

// The layout builds the title, canonical and share tags from these.
export const load: PageServerLoad = () => ({
  ...getParkIndex(),
  url: '/find/',
  title: 'Find a Park',
  description:
    'Find a park in Monroe County, New York by what it has: playgrounds, trails, dog parks, spray parks, pickleball, disc golf, sledding hills and more.',
});
