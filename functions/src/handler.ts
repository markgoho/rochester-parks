import { rochesterDay, text } from './respond.js';
import { moderate } from './surface.js';
import { tokenMatches } from './token.js';

/**
 * The comments Function's one HTTP handler (#217). Request in, response out.
 * The store, the secrets and the clock are passed in, so tests run it with
 * in-memory fakes and nothing here touches Firebase.
 */

/** The Subject tokens, the same on the form and in storage (#217). */
export const SUBJECTS = [
  'comment',
  'correction',
  'reservation-question',
] as const;

export type Subject = (typeof SUBJECTS)[number];

const isSubject = (value: string): value is Subject =>
  (SUBJECTS as readonly string[]).includes(value);

/** A Comment as the `comments` collection holds it, with its id (#217). */
export interface StoredComment {
  id: string;
  page: string;
  parent: string | null;
  state: 'queue' | 'approved';
  name: string;
  email: string | null;
  body: string;
  subject: Subject | null;
  created: Date;
  owner: boolean;
  flags: string[];
}

export interface CommentStore {
  /** Writes one document and returns its id. */
  add(comment: Omit<StoredComment, 'id'>): Promise<string>;
  get(id: string): Promise<StoredComment | undefined>;
  /** Every Comment in the Moderation queue. */
  inQueue(): Promise<StoredComment[]>;
  /** Every Approved Comment and Reply. */
  approved(): Promise<StoredComment[]>;
  /** Deletes a Comment and every Reply under it, in one batch. */
  removeWithReplies(id: string): Promise<void>;
  /** Sets `approved` and saves the body, which the owner may have redacted. */
  approve(id: string, body: string): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * What the announcement workflow gets (#222). It opens a public issue, so it
 * never carries a Commenter's name, words or email: the repo is public.
 */
export interface Announcement {
  pageTitle: string;
  subject: Subject;
  /** The day the Comment came in, in Rochester, `YYYY-MM-DD`. */
  date: string;
  /** The Comment's flags, or `none`. */
  flag: string;
  commentId: string;
}

export interface GitHubClient {
  /** Dispatches the announcement workflow on `main`. */
  announce(announcement: Announcement): Promise<void>;
  /** Closes the open `comment` issue whose body holds this Comment's id. */
  closeAnnouncement(commentId: string): Promise<void>;
  /** Dispatches the deploy workflow on `main`, which rebuilds the site. */
  deploy(): Promise<void>;
}

export interface Deps {
  store: CommentStore;
  github: GitHubClient;
  /** Logs at error level, which the Function's error alert watches. */
  logError: (message: string, error?: unknown) => void;
  secrets: {
    hmacKey: string;
    /** The one password of the Moderation surface. */
    password: string;
  };
  clock: () => Date;
}

export interface FunctionRequest {
  method: string;
  path: string;
  /** The url-encoded form fields, as the platform parsed them. */
  form: Record<string, unknown>;
  /** Request headers, lower-case names. */
  headers?: Record<string, string | undefined>;
  /** The query string's parameters. */
  query?: Record<string, string>;
}

export interface FunctionResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

const NAME_MAX = 100;
const BODY_MAX = 5000;

export async function handle(
  request: FunctionRequest,
  deps: Deps
): Promise<FunctionResponse> {
  if (request.path === '/comments' || request.path.startsWith('/comments/')) {
    return moderate(request, deps);
  }
  if (request.path !== '/comment') return text(404, 'Not found.');
  if (request.method !== 'POST') {
    const refused = text(405, 'Method not allowed.');
    return { ...refused, headers: { ...refused.headers, Allow: 'POST' } };
  }
  return receive(request.form, deps);
}

/** The public post, in the order #217 fixes. */
async function receive(
  form: Record<string, unknown>,
  deps: Deps
): Promise<FunctionResponse> {
  const field = (name: string) =>
    typeof form[name] === 'string' ? (form[name] as string) : '';
  const page = field('page');

  // 1. The token runs first, so a redirect only ever goes to a path the
  //    build signed.
  if (
    !page.startsWith('/') ||
    !tokenMatches(page, field('token'), deps.secrets.hmacKey)
  ) {
    return notSent(
      'This form did not come from a page on this site, or the page is out of date.'
    );
  }

  const sent = {
    status: 303,
    headers: { Location: `${page}#comment-sent` },
    body: '',
  };

  // 2. The honeypot: the only silent drop (#24).
  if (field('leave_blank') !== '') return sent;

  // 3. Validate. HTML is stripped, not rejected.
  const subject = field('subject');
  const name = field('name').trim();
  const email = field('email').trim();
  const body = field('body')
    .replace(/<[^>]*>/g, '')
    .trim();
  if (!isSubject(subject)) {
    return notSent('Pick what the comment is about.');
  }
  if (!name) return notSent('Your name is missing.');
  if (name.length > NAME_MAX) {
    return notSent(`Your name is longer than ${NAME_MAX} characters.`);
  }
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) {
    return notSent('Your email address does not look right.');
  }
  if (!body) return notSent('Your comment is empty.');
  if (body.length > BODY_MAX) {
    return notSent(`Your comment is longer than ${BODY_MAX} characters.`);
  }

  // 4. Flag, never reject: two or more links.
  //    A link starts with a scheme or a bare www., and runs to whitespace,
  //    so https://www.example.com counts once.
  const links = body.match(/\b(?:https?:\/\/|www\.)\S+/gi)?.length ?? 0;

  // 5. Write one queue document. No IP, no user agent (#206).
  const created = deps.clock();
  const flags = links >= 2 ? ['links'] : [];
  const id = await deps.store.add({
    page,
    parent: null,
    state: 'queue',
    name,
    email,
    body,
    subject,
    created,
    owner: false,
    flags,
  });

  // 6. Announce. A failure keeps the Comment: it waits in the queue, and the
  //    error log raises the alert (#30).
  try {
    await deps.github.announce({
      pageTitle: titleOf(page),
      subject,
      date: rochesterDay.format(created),
      flag: flags.join(', ') || 'none',
      commentId: id,
    });
  } catch (error) {
    deps.logError(`Announcement failed for Comment ${id}`, error);
  }

  // 7. Back to the page, where the banner shows.
  return sent;
}

/**
 * A page's title from its signed path: "sanford-road-park" becomes "Sanford
 * Road Park". The form posts no title, and a posted one would let anyone
 * write into a public issue title. The site's content loader titles an
 * untitled page the same way (`titleFromUrl` in src/lib/server/content.ts).
 */
function titleOf(path: string): string {
  const slug = path.split('/').filter(Boolean).pop() ?? '';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * A failed check. The page names the problem and sends the reader back with
 * the browser's Back button, where their text is still in the form. It never
 * links to the posted page, which may not be ours.
 */
function notSent(problem: string): FunctionResponse {
  return {
    status: 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Your comment was not sent</title>
<body style="font-family: system-ui, sans-serif; max-width: 36rem; margin: 3rem auto; padding: 0 1rem; line-height: 1.5">
<h1>Your comment was not sent</h1>
<p>${problem}</p>
<p>Use your browser's Back button to go back to the page. Your text is still in the form there.</p>
</body>
</html>
`,
  };
}
