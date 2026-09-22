import type { CommentWithReplies, PageComment } from './types.js';

/**
 * A Comment as the `comments` collection stores it (#217). The build reads
 * only Approved ones, but the shape is the whole document, so the shaping
 * below is the one place that decides what a reader may see.
 */
export interface StoredComment {
  /** URL path of the page, e.g. "/town-parks/riga-parks/sanford-road-park/". */
  page: string;
  /** The id of the Comment this answers; null if top-level. */
  parent: string | null;
  state: 'queue' | 'approved';
  name: string;
  email: string | null;
  body: string;
  subject: 'comment' | 'correction' | 'reservation-question' | null;
  created: Date;
  owner: boolean;
  flags: string[];
}

/** The day a Comment was written, as a reader in Rochester would date it. */
const rochesterDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function visible(id: string, comment: StoredComment): PageComment {
  return {
    id,
    name: comment.name,
    body: comment.body,
    created: rochesterDay.format(comment.created),
    owner: comment.owner,
  };
}

const oldestFirst = (
  a: { created: Date; id: string },
  b: { created: Date; id: string }
) => a.created.getTime() - b.created.getTime() || a.id.localeCompare(b.id);

/**
 * Approved Comment documents in, the per-page render shape out, keyed by page
 * path. Only id, name, body, date and the owner mark survive: no email, IP,
 * Subject, flags or state. A Reply whose parent is not a top-level Comment in
 * the set is dropped, so no answer shows without its question. Comments and
 * their Replies are oldest first.
 */
export function shapeComments(
  documents: (StoredComment & { id: string })[]
): Record<string, CommentWithReplies[]> {
  const sorted = [...documents].sort(oldestFirst);
  const topLevel = new Map<string, CommentWithReplies>();
  for (const doc of sorted) {
    if (doc.parent === null) {
      topLevel.set(doc.id, { ...visible(doc.id, doc), replies: [] });
    }
  }
  for (const doc of sorted) {
    if (doc.parent !== null) {
      topLevel.get(doc.parent)?.replies.push(visible(doc.id, doc));
    }
  }

  const pages: Record<string, CommentWithReplies[]> = {};
  for (const doc of sorted) {
    const comment = topLevel.get(doc.id);
    if (comment) (pages[doc.page] ??= []).push(comment);
  }
  return pages;
}
