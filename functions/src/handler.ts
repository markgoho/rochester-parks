import { tokenMatches } from './token.js';

/**
 * The comments Function's one HTTP handler (#217). Request in, response out.
 * The store, the secrets and the clock are passed in, so tests run it with
 * in-memory fakes and nothing here touches Firebase.
 */

export const SUBJECTS = ['comment', 'correction', 'reservation-question'];

export type Subject = 'comment' | 'correction' | 'reservation-question';

/** A new Comment as the public form writes it to the Moderation queue. */
export interface NewComment {
  page: string;
  parent: null;
  state: 'queue';
  name: string;
  email: string;
  body: string;
  subject: Subject;
  created: Date;
  owner: false;
  flags: string[];
}

export interface CommentStore {
  /** Writes one document and returns its id. */
  add(comment: NewComment): Promise<string>;
}

export interface Deps {
  store: CommentStore;
  secrets: { hmacKey: string };
  clock: () => Date;
}

export interface FunctionRequest {
  method: string;
  path: string;
  /** The url-encoded form fields, as the platform parsed them. */
  form: Record<string, unknown>;
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
  if (request.path !== '/comment') return text(404, 'Not found.');
  if (request.method !== 'POST') {
    return { ...text(405, 'Method not allowed.'), headers: { Allow: 'POST' } };
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
  if (!SUBJECTS.includes(subject)) {
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
  const links = body.match(/https?:\/\/|www\./gi)?.length ?? 0;

  // 5. Write one queue document. No IP, no user agent (#206).
  await deps.store.add({
    page,
    parent: null,
    state: 'queue',
    name,
    email,
    body,
    subject: subject as Subject,
    created: deps.clock(),
    owner: false,
    flags: links >= 2 ? ['links'] : [],
  });

  // 6. Back to the page, where the banner shows.
  return sent;
}

function text(status: number, message: string): FunctionResponse {
  return {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    body: message,
  };
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
