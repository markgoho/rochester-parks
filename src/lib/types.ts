export type Layout =
  | 'home'
  | 'default-list'
  | 'default-single'
  | 'park-list'
  | 'park-single';

export interface PageLink {
  title: string;
  url: string;
}

/** A rendered content page, as returned by the catch-all route's load. */
export interface Page extends PageLink {
  description: string;
  layout: Layout;
  html: string;
  /** Child pages and sections, sorted by title. */
  children: PageLink[];
  /** Home first, then each ancestor section. */
  ancestors: PageLink[];
  jsonLd: object[];
}
