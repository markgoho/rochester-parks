import type {
  CommentArea,
  CommentWithReplies,
  FrontMatter,
  Layout,
  ReservationLink,
} from './types.js';

/**
 * Which pages take Comments, and whether the form is open (#212). Park and
 * Trail pages are known by their single-page layouts. A Blog post is known by
 * its place in the blog section, because About shares its layout. Never
 * About, list or index pages.
 */
function takesComments(layout: Layout, url: string): boolean {
  if (layout === 'park-single' || layout === 'trail-single') return true;
  return layout === 'default-single' && url.startsWith('/blog/');
}

/**
 * The comment area for one page, or `undefined` when the page takes none.
 * `comments: false` in the front matter closes the form; it cannot open a
 * page kind that takes none. Only a Park page carries its section's
 * reservation link: a Trail or a Blog post has no owner that books it.
 */
export function commentAreaOf({
  layout,
  url,
  frontMatter,
  reservations,
  comments = [],
}: {
  layout: Layout;
  url: string;
  frontMatter: FrontMatter;
  /** The `reservations` link of the section the page is filed under. */
  reservations?: ReservationLink;
  /** The page's Approved Comments, already shaped. */
  comments?: CommentWithReplies[];
}): CommentArea | undefined {
  if (!takesComments(layout, url)) return undefined;
  return {
    open: frontMatter.comments !== false,
    ...(layout === 'park-single' && reservations ? { reservations } : {}),
    comments,
  };
}
