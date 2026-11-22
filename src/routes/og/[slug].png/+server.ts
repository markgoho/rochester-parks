import { error } from '@sveltejs/kit';
import { getShareCards } from '#lib/server/content.js';
import { parkCard, siteCard } from '#lib/server/share-card.js';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

const cards = new Map(getShareCards().map((card) => [card.slug, card]));

/** `site` is the card for every page that is not a Park without a photo. */
export const entries: EntryGenerator = () => [
  { slug: 'site' },
  ...[...cards.keys()].map((slug) => ({ slug })),
];

export const GET: RequestHandler = ({ params }) => {
  const card = cards.get(params.slug);
  if (params.slug !== 'site' && !card) error(404, 'Not found');
  const png = card ? parkCard(card) : siteCard();
  return new Response(png as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
