import { getIndexableUrls } from '$lib/server/content';
import { absUrl } from '$lib/site';

export const prerender = true;

export function GET() {
  const urls = getIndexableUrls()
    .map((url) => `<url><loc>${absUrl(url)}</loc></url>`)
    .join('');
  const xml = `<?xml version="1.0" encoding="utf-8" standalone="yes"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
