import { error } from '@sveltejs/kit';
import { getListCards, getShareCards } from '#lib/server/content.js';
import { parkCard, siteCard, titleCard } from '#lib/server/share-card.js';
import { hasPhotoCard } from '#lib/site.js';
import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

const cards = new Map(
  getShareCards()
    .filter((card) => !hasPhotoCard(card.photo))
    .map((card) => [card.slug, card])
);
const lists = new Map(getListCards().map((card) => [card.slug, card]));

/** Cards with a photo on disk are JPEGs, in `../[slug].jpg`. `site` is the card for every page that has none of its own. */
export const entries: EntryGenerator = () => [
  { slug: 'site' },
  ...[...cards.keys(), ...lists.keys()].map((slug) => ({ slug })),
];

export const GET: RequestHandler = ({ params }) => {
  const card = cards.get(params.slug);
  const list = lists.get(params.slug);
  if (params.slug !== 'site' && !card && !list) error(404, 'Not found');
  const png = card
    ? parkCard(card)
    : list
      ? titleCard(list.title, list.subtitle)
      : siteCard();
  return new Response(png as BodyInit, {
    headers: { 'Content-Type': 'image/png' },
  });
};
