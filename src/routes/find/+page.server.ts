import { getParkIndex } from '#lib/server/content.js';
import type { PageServerLoad } from './$types';

export const prerender = true;
// The one page that needs a client runtime: filtering happens in the browser
// against the prerendered index, so the rest of the site stays JS-free.
export const csr = true;

export const load: PageServerLoad = () => getParkIndex();
