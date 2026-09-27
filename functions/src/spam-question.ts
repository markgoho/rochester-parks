/**
 * The Jev question that the spam check asks (#259, #281). It is in its own
 * module, with no Firebase import, so the offline test
 * (`scripts/spam-eval.ts`, #284) asks the same question that ships.
 */

/** The TypeSafe model, pinned: a new version needs the offline test again. */
export const SPAM_MODEL = 'jev-1.13.0';

/** A TypeSafe `noul` question: the probability that `true` holds. */
export interface NoulQuestion {
  type: 'noul';
  instructions: string;
  criteria: { true: string; false: string };
}

export const SPAM_QUESTION: NoulQuestion = {
  type: 'noul',
  instructions:
    'Was `comment` written to advertise, to get a link seen or about some other subject, rather than by a real visitor to a page about `page_title`, a park guide for Rochester, NY?',
  criteria: {
    true: 'Spam: it promotes a product, service, website, clinic, casino, crypto scheme or SEO offer, or it is generic praise that could be pasted on any website, or it is about a subject that has nothing to do with this page, parks or Rochester.',
    false:
      'A real comment: a question, a correction, a memory or an opinion about this park, this post or parks in Rochester, even if short, misspelled or with a link to a real source.',
  },
};
