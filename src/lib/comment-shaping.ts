import type { CommentWithReplies, PageComment } from './types.js';

/**
 * A Comment as the `comments` collection stores it (#217). The build reads
 * only Approved ones, and the document holds private fields (email,
 * Subject, flags), so the shaping below is the one place that decides what
 * a reader may see.
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

/** A stored Comment with its document id. */
export type StoredCommentWithId = StoredComment & { id: string };

/** The day a Comment was written, as a reader in Rochester would date it. */
const rochesterDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/New_York',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function toPageComment(id: string, comment: StoredComment): PageComment {
  return {
    id,
    name: comment.name,
    body: comment.body,
    created: rochesterDay.format(comment.created),
    owner: comment.owner,
  };
}

const oldestFirst = (a: StoredCommentWithId, b: StoredCommentWithId) =>
  a.created.getTime() - b.created.getTime() || a.id.localeCompare(b.id);

/**
 * Approved Comment documents in, the per-page render shape out, keyed by page
 * path. Only id, name, body, date and the owner mark survive: no email, IP,
 * Subject, flags or state. A Reply whose parent is not a top-level Comment in
 * the set is dropped, so no answer shows without its question. Comments and
 * their Replies are oldest first.
 */
export function shapeComments(
  documents: StoredCommentWithId[]
): Record<string, CommentWithReplies[]> {
  const sorted = [...documents].sort(oldestFirst);
  const topLevel = new Map<string, CommentWithReplies>();
  const pageOf = new Map<string, string>();
  for (const doc of sorted) {
    if (doc.parent === null) {
      topLevel.set(doc.id, { ...toPageComment(doc.id, doc), replies: [] });
      pageOf.set(doc.id, doc.page);
    }
  }
  for (const doc of sorted) {
    if (doc.parent === null) continue;
    const parent = topLevel.get(doc.parent);
    // A Reply shows only under its own parent, on its parent's page.
    if (parent && pageOf.get(doc.parent) === doc.page) {
      parent.replies.push(toPageComment(doc.id, doc));
    }
  }

  const pages: Record<string, CommentWithReplies[]> = {};
  for (const doc of sorted) {
    const comment = topLevel.get(doc.id);
    if (comment) (pages[doc.page] ??= []).push(comment);
  }
  return pages;
}
