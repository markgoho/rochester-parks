import { createHash, timingSafeEqual } from 'node:crypto';
import type {
  Deps,
  FunctionRequest,
  FunctionResponse,
  StoredComment,
} from './handler.js';
import { rochesterDay, text } from './respond.js';

/**
 * The Moderation surface (#217, #223): owner-only HTML pages on the comments
 * Function, at its own `run.app` URL, never rewritten through Hosting. Plain
 * forms and no client JavaScript. One password by HTTP Basic auth; the
 * platform serves only HTTPS.
 *
 *   GET  /comments              the Moderation queue
 *   GET  /comments/{id}         one Comment, with its actions
 *   POST /comments/{id}/approve approve, with the body as edited
 *   POST /comments/{id}/reject  delete
 *   GET  /comments/approved     Approved Comments per page (#224)
 *   POST /comments/{id}/reply   reply as the site, under a top-level Comment
 *   POST /comments/{id}/delete  delete an Approved Comment and its Replies
 *
 * Approve and reject act on a queued Comment only; delete on an Approved
 * one. Every action answers with a 303, so a refresh never sends it twice.
 */

const BODY_MAX = 5000;

const GONE = 'No such Comment. It may have been deleted.';

/** The owner's own Comments are signed as the site (#28). */
const SITE = 'Rochester Parks';

export async function moderate(
  request: FunctionRequest,
  deps: Deps
): Promise<FunctionResponse> {
  let response: FunctionResponse;
  try {
    response = await route(request, deps);
  } catch (error) {
    deps.logError('The Moderation surface failed', error);
    response = text(500, 'Something went wrong. Try again in a minute.');
  }
  // Nothing on the surface is cached or indexed, including the refusals.
  return {
    ...response,
    headers: {
      ...response.headers,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  };
}

async function route(
  request: FunctionRequest,
  deps: Deps
): Promise<FunctionResponse> {
  const headers = request.headers ?? {};
  if (!signedIn(headers.authorization, deps.secrets.password)) {
    const refused = text(401, 'Sign in to moderate Comments.');
    return {
      ...refused,
      headers: {
        ...refused.headers,
        'WWW-Authenticate': 'Basic realm="Rochester Parks moderation"',
      },
    };
  }

  const [, , id, action] = request.path.split('/');
  if (request.method === 'GET') {
    if (!id) return queuePage(deps, request.query ?? {});
    if (id === 'approved' && !action) {
      return approvedPage(deps, request.query ?? {});
    }
    if (!action) return commentPage(id, deps);
    return text(404, 'Not found.');
  }
  if (request.method !== 'POST' || !id) return text(405, 'Not allowed.');
  if (!sameSite(headers))
    return text(403, 'A form on another site cannot moderate.');

  const comment = await deps.store.get(id);
  if (!comment) return text(404, GONE);
  const posted = typeof request.form.body === 'string' ? request.form.body : '';
  switch (action) {
    case 'approve':
    case 'reject':
      if (comment.state !== 'queue') {
        return text(409, 'This Comment is already Approved.');
      }
      return action === 'approve'
        ? approve(comment, posted, deps)
        : reject(comment, deps);
    case 'reply':
      if (comment.parent !== null) {
        return text(409, 'A Reply never has a Reply.');
      }
      return reply(comment, posted, deps);
    case 'delete':
      if (comment.state !== 'approved') {
        return text(409, 'Reject a queued Comment instead.');
      }
      return remove(comment, deps);
    default:
      return text(404, 'Not found.');
  }
}

/** Basic auth: any user name, the one password, compared in constant time. */
function signedIn(
  authorization: string | undefined,
  password: string
): boolean {
  if (!password || !authorization?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(authorization.slice(6), 'base64').toString();
  const given = decoded.slice(decoded.indexOf(':') + 1);
  // Hashing first gives both sides the same length, so the compare leaks
  // nothing about the password's length either.
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(given), digest(password));
}

/**
 * The browser sends the Basic credentials with any request to this host, so
 * a form on another site could post here as the owner. A post must come from
 * the surface's own pages.
 */
function sameSite(headers: Record<string, string | undefined>): boolean {
  const site = headers['sec-fetch-site'];
  if (site && site !== 'same-origin' && site !== 'none') return false;
  const origin = headers.origin;
  if (!origin) return true;
  if (!headers.host) return false;
  try {
    return new URL(origin).host === headers.host;
  } catch {
    return false;
  }
}

/** What the queue says after an action, from the redirect's parameters. */
function notices(query: Record<string, string>): string[] {
  const said: string[] = [];
  if (query.done === 'approved') said.push('Approved.');
  if (query.done === 'rejected') said.push('Rejected. The Comment is deleted.');
  if (query.done === 'replied') said.push('Your Reply is saved and Approved.');
  if (query.done === 'deleted') {
    said.push('Deleted, with its Replies.');
  }
  if (query.issue === 'closed') said.push('Its announcement issue is closed.');
  if (query.issue === 'failed') {
    said.push(
      'Its announcement issue could not be closed. Close it by hand on GitHub.'
    );
  }
  if (query.deploy === 'started') {
    said.push('The site is rebuilding. The page changes in about 90 seconds.');
  }
  if (query.deploy === 'failed') {
    // The cron in firebase-hosting-merge.yml is the backstop (ADR-0012).
    said.push(
      'The rebuild did not start. The change is saved, and the daily rebuild publishes it.'
    );
  }
  return said;
}

async function queuePage(
  deps: Deps,
  query: Record<string, string>
): Promise<FunctionResponse> {
  // Unflagged by date first, flagged last, so likely spam does not bury a
  // real Comment. A reservation question gets no special place (#213).
  const queue = (await deps.store.inQueue()).sort(
    (a, b) =>
      Number(a.flags.length > 0) - Number(b.flags.length > 0) ||
      a.created.getTime() - b.created.getTime()
  );
  return page(
    'Moderation queue',
    said(query) +
      (queue.length
        ? `<ol class="queue">${queue
            .map(
              (comment) =>
                `<li>${card(comment)}<p><a href="/comments/${escape(comment.id)}">Open this Comment</a></p></li>`
            )
            .join('')}</ol>`
        : '<p>The queue is empty.</p>') +
      '<p><a href="/comments/approved">Approved Comments</a></p>'
  );
}

function said(query: Record<string, string>): string {
  return notices(query)
    .map((notice) => `<p class="notice">${escape(notice)}</p>`)
    .join('');
}

async function commentPage(
  id: string,
  deps: Deps,
  problem?: string
): Promise<FunctionResponse> {
  const comment = await deps.store.get(id);
  if (!comment) return text(404, GONE);
  const at = `/comments/${escape(comment.id)}`;
  const said = problem ? `<p class="notice">${escape(problem)}</p>` : '';
  const actions =
    comment.state === 'queue'
      ? `<form method="post" action="${at}/approve">
  <label for="body">Body as it will be published</label>
  <p class="hint">Before you approve, replace a private phone number, email or postal address with [phone removed], [email removed] or [address removed]. A public office number stays.</p>
  <textarea id="body" name="body" rows="8" maxlength="${BODY_MAX}" required>${escape(comment.body)}</textarea>
  <button type="submit">Approve</button>
</form>
${replyForm(comment)}
<form method="post" action="${at}/reject">
  <button type="submit" class="quiet">Reject and delete</button>
</form>`
      : `<p>This ${comment.parent ? 'Reply' : 'Comment'} is Approved and on its page.</p>
${replyForm(comment)}${deleteForm(comment)}`;
  return page(
    comment.state === 'approved' ? 'Approved Comment' : 'Comment in the queue',
    `${card(comment)}
${said}${actions}
<p><a href="/comments">The queue</a> · <a href="/comments/approved">Approved Comments</a></p>`
  );
}

/**
 * Reply as the site, under a top-level Comment only: a Reply never has a
 * Reply. On a queued Comment the Reply approves it too (#217).
 */
function replyForm(comment: StoredComment): string {
  if (comment.parent !== null) return '';
  const field = `reply-${escape(comment.id)}`;
  return `<form method="post" action="/comments/${escape(comment.id)}/reply">
  <label for="${field}">Reply as ${SITE}</label>
  ${comment.state === 'queue' ? '<p class="hint">Replying approves this Comment as it stands.</p>' : ''}
  <textarea id="${field}" name="body" rows="4" maxlength="${BODY_MAX}" required></textarea>
  <button type="submit">Reply</button>
</form>`;
}

function deleteForm(comment: StoredComment): string {
  return `<form method="post" action="/comments/${escape(comment.id)}/delete">
  <button type="submit" class="quiet">Delete${comment.parent ? '' : ' with its Replies'}</button>
</form>`;
}

/** Approved Comments per page, each with its Replies (#224). */
async function approvedPage(
  deps: Deps,
  query: Record<string, string>
): Promise<FunctionResponse> {
  const all = (await deps.store.approved()).sort(
    (a, b) => a.created.getTime() - b.created.getTime()
  );
  const pages = [...new Set(all.map((comment) => comment.page))].sort();
  const entry = (comment: StoredComment) =>
    `<li>${card(comment)}${replyForm(comment)}${deleteForm(comment)}</li>`;
  const listed = pages
    .map((path) => {
      const here = all.filter((comment) => comment.page === path);
      const top = here.filter((comment) => comment.parent === null);
      const orphans = here.filter(
        (comment) =>
          comment.parent !== null &&
          !top.some((parent) => parent.id === comment.parent)
      );
      const items = top
        .map((parent) => {
          const replies = here.filter((c) => c.parent === parent.id);
          return `<li>${card(parent)}${replyForm(parent)}${deleteForm(parent)}${
            replies.length
              ? `<ol class="replies">${replies.map(entry).join('')}</ol>`
              : ''
          }</li>`;
        })
        .concat(orphans.map(entry))
        .join('');
      return `<section><h2>${escape(path)}</h2><ol class="queue">${items}</ol></section>`;
    })
    .join('');
  return page(
    'Approved Comments',
    `${said(query)}${listed || '<p>No Approved Comments yet.</p>'}
<p><a href="/comments">The queue</a></p>`
  );
}

async function approve(
  comment: StoredComment,
  edited: string,
  deps: Deps
): Promise<FunctionResponse> {
  const body = edited.replace(/\r\n/g, '\n').trim();
  if (!body || body.length > BODY_MAX) {
    const problem = body
      ? `The body is longer than ${BODY_MAX} characters.`
      : 'The body is empty. Reject the Comment instead, or write what to publish.';
    return { ...(await commentPage(comment.id, deps, problem)), status: 400 };
  }
  await deps.store.approve(comment.id, body);
  const issue = await closeIssue(comment.id, deps);
  const deploy = await rebuild(deps);
  return toQueue(`done=approved&issue=${issue}&deploy=${deploy}`);
}

async function reject(
  comment: StoredComment,
  deps: Deps
): Promise<FunctionResponse> {
  await deps.store.remove(comment.id);
  return toQueue(`done=rejected&issue=${await closeIssue(comment.id, deps)}`);
}

async function reply(
  comment: StoredComment,
  posted: string,
  deps: Deps
): Promise<FunctionResponse> {
  const body = posted.replace(/\r\n/g, '\n').trim();
  if (!body || body.length > BODY_MAX) {
    const problem = body
      ? `The Reply is longer than ${BODY_MAX} characters.`
      : 'The Reply is empty.';
    return { ...(await commentPage(comment.id, deps, problem)), status: 400 };
  }
  // The answer never sits under nothing: a queued Comment is approved in the
  // same step, as it stands, and its announcement issue closes.
  let issue = '';
  if (comment.state === 'queue') {
    await deps.store.approve(comment.id, comment.body);
    issue = `&issue=${await closeIssue(comment.id, deps)}`;
  }
  await deps.store.add({
    page: comment.page,
    parent: comment.id,
    state: 'approved',
    name: SITE,
    email: null,
    body,
    subject: null,
    created: deps.clock(),
    owner: true,
    flags: [],
  });
  return toPage(
    '/comments/approved',
    `done=replied${issue}&deploy=${await rebuild(deps)}`
  );
}

/** The removal path: no proof of identity asked (#206). */
async function remove(
  comment: StoredComment,
  deps: Deps
): Promise<FunctionResponse> {
  for (const answer of await deps.store.replies(comment.id)) {
    await deps.store.remove(answer.id);
  }
  await deps.store.remove(comment.id);
  return toPage(
    '/comments/approved',
    `done=deleted&deploy=${await rebuild(deps)}`
  );
}

function toQueue(query: string): FunctionResponse {
  return toPage('/comments', query);
}

function toPage(path: string, query: string): FunctionResponse {
  return { status: 303, headers: { Location: `${path}?${query}` }, body: '' };
}

/** Closes the announcement issue; a failure is noted, never fatal. */
async function closeIssue(
  id: string,
  deps: Deps
): Promise<'closed' | 'failed'> {
  try {
    await deps.github.closeAnnouncement(id);
    return 'closed';
  } catch (error) {
    deps.logError(`Closing the announcement for Comment ${id} failed`, error);
    return 'failed';
  }
}

/**
 * Dispatches the deploy. A failure shows on the queue page: the Comment
 * stays Approved, and the daily rebuild publishes it (ADR-0012).
 */
async function rebuild(deps: Deps): Promise<'started' | 'failed'> {
  try {
    await deps.github.deploy();
    return 'started';
  } catch (error) {
    deps.logError('The deploy dispatch failed', error);
    return 'failed';
  }
}

/** One Comment with everything the owner decides from (#30). */
function card(comment: StoredComment): string {
  const facts: [string, string][] = [
    ['Page', comment.page],
    ['Subject', comment.subject ?? '—'],
    ['Date', rochesterDay.format(comment.created)],
    ['Flags', comment.flags.join(', ') || 'none'],
    ['Name', comment.name],
    ['Email', comment.email ?? '—'],
  ];
  return `<article class="card"${comment.flags.length ? ' data-flagged' : ''}>
<dl>${facts.map(([term, value]) => `<dt>${term}</dt><dd>${escape(value)}</dd>`).join('')}</dl>
<p class="body">${escape(comment.body)}</p>
</article>`;
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function page(title: string, content: string): FunctionResponse {
  return {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escape(title)} · Rochester Parks</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 44rem; margin: 2rem auto; padding: 0 1rem; line-height: 1.5; }
  .queue { list-style: none; padding: 0; }
  .card { border: 1px solid #bbb; padding: 0.75rem 1rem; margin-block: 1rem 0.25rem; }
  .card[data-flagged] { border-color: #c2410c; }
  dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.1rem 1rem; margin: 0; }
  dt { font-weight: 700; }
  dd { margin: 0; overflow-wrap: anywhere; }
  .body { white-space: pre-line; overflow-wrap: anywhere; }
  form { display: grid; gap: 0.5rem; margin-block: 1rem; }
  textarea { font: inherit; inline-size: 100%; box-sizing: border-box; }
  .hint { font-size: 0.9em; color: #555; margin: 0; }
  button { justify-self: start; font: inherit; padding: 0.5rem 1rem; cursor: pointer; }
  .quiet { background: none; border: 1px solid #999; }
  .replies { list-style: none; padding-inline-start: 1.5rem; }
  .notice { border-inline-start: 4px solid #c2410c; padding-inline-start: 0.75rem; }
</style>
<h1>${escape(title)}</h1>
${content}
</html>
`,
  };
}
