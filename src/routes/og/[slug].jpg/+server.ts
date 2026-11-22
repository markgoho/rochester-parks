import { error } from '@sveltejs/kit';
import { getShareCards } from '#lib/server/content.js';
import { photoShareCard } from '#lib/server/share-card.js';
import { hasPhotoCard } from '#lib/site.js';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

// A park or trail with a photo gets a JPEG card, since a photo as PNG is
// over a megabyte and some chat apps drop a share image that big.
const cards = new Map(
  getShareCards()
    .filter((card) => hasPhotoCard(card.photo))
    .map((card) => [card.slug, card])
);

export const entries: EntryGenerator = () =>
  [...cards.keys()].map((slug) => ({ slug }));

export const GET: RequestHandler = async ({ params }) => {
  const card = cards.get(params.slug);
  if (!card) error(404, 'Not found');
  return new Response((await photoShareCard(card)) as BodyInit, {
    headers: { 'Content-Type': 'image/jpeg' },
  });
};
