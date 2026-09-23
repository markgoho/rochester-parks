import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { handle, type CommentStore, type GitHubClient } from './handler.js';

/**
 * The one comments Function (#217, ADR-0012): 2nd gen, `us-east4` beside the
 * database, the default service account, no key material and no warm
 * instance. A Hosting rewrite sends `/comment` here.
 */

initializeApp();

/** The page-token key. The same value is the deploy workflow's secret. */
const hmacKey = defineSecret('COMMENT_HMAC_KEY');

/**
 * A fine-grained token for this repo alone, with Actions write and Issues
 * write, no expiry (#217). Actions write dispatches the workflows.
 */
const githubToken = defineSecret('GITHUB_DISPATCH_TOKEN');

const REPO = 'markgoho/rochester-parks';

/** Dispatches a workflow on `main` through the GitHub API. */
async function dispatch(
  workflow: string,
  inputs: Record<string, string>
): Promise<void> {
  const response = await fetch(
    `https://api.github.com/repos/${REPO}/actions/workflows/${workflow}/dispatches`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${githubToken.value()}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({ ref: 'main', inputs }),
      // The reader waits on this before the 303, so a slow GitHub fails
      // fast and is logged instead.
      signal: AbortSignal.timeout(10_000),
    }
  );
  if (!response.ok) {
    throw new Error(`${workflow}: ${response.status} ${await response.text()}`);
  }
}

const github: GitHubClient = {
  announce: ({ pageTitle, subject, date, flag, commentId }) =>
    dispatch('announce-comment.yml', {
      page_title: pageTitle,
      subject,
      date,
      flag,
      comment_id: commentId,
    }),
};

const store: CommentStore = {
  async add(comment) {
    const doc = await getFirestore().collection('comments').add(comment);
    return doc.id;
  },
};

export const comments = onRequest(
  {
    region: 'us-east4',
    secrets: [hmacKey, githubToken],
    minInstances: 0,
    invoker: 'public',
  },
  async (request, response) => {
    const result = await handle(
      { method: request.method, path: request.path, form: request.body ?? {} },
      {
        store,
        github,
        logError: (message, error) =>
          logger.error(message, { error: String(error) }),
        secrets: { hmacKey: hmacKey.value() },
        clock: () => new Date(),
      }
    );
    response.status(result.status).set(result.headers).send(result.body);
  }
);
