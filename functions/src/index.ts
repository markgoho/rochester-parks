import { initializeApp } from 'firebase-admin/app';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import {
  handle,
  type CommentStore,
  type GitHubClient,
  type SpamInput,
  type StoredComment,
} from './handler.js';

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

/** The Moderation surface's one password (#223). */
const moderationPassword = defineSecret('MODERATION_PASSWORD');

/** TypeSafe's API key, for the spam check (#259). */
const typesafeKey = defineSecret('TYPESAFE_API_KEY');

const REPO = 'markgoho/rochester-parks';

/** One GitHub REST call; any status but 2xx throws. */
async function gitHubRequest(
  method: string,
  path: string,
  body?: unknown
): Promise<Response> {
  const response = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken.value()}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    // The reader or the owner waits on this, so a slow GitHub fails fast
    // and is logged instead.
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(
      `${method} ${path}: ${response.status} ${await response.text()}`
    );
  }
  return response;
}

/** Dispatches a workflow on `main` through the GitHub API. */
async function dispatch(
  workflow: string,
  inputs: Record<string, string> = {}
): Promise<void> {
  await gitHubRequest('POST', `/actions/workflows/${workflow}/dispatches`, {
    ref: 'main',
    inputs,
  });
}

/**
 * Closes the open `comment` issue whose body holds the Comment's id. The
 * document stores no issue number (#217), so the id is the join.
 */
async function closeAnnouncement(commentId: string): Promise<void> {
  const response = await gitHubRequest(
    'GET',
    '/issues?labels=comment&state=open&per_page=100'
  );
  const issues = (await response.json()) as { number: number; body?: string }[];
  for (const issue of issues.filter((i) => i.body?.includes(commentId))) {
    await gitHubRequest('PATCH', `/issues/${issue.number}`, {
      state: 'closed',
      state_reason: 'completed',
    });
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
  closeAnnouncement,
  deploy: () => dispatch('firebase-hosting-merge.yml'),
};

/**
 * Asks TypeSafe's Jev for the probability that a post is spam (#259). The
 * question is the one tested offline on the spam of 2026-09-23 and the
 * Archive; a change to it needs that test again. Any failure is null: no
 * signal, so the post goes on as if unchecked (#32).
 */
async function spam(input: SpamInput): Promise<number | null> {
  try {
    const response = await fetch('https://api.typesafe.ai/v1/systemone', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${typesafeKey.value()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'jev-1.13.0',
        state: {
          page_title: input.pageTitle,
          name: input.name,
          comment: input.body,
        },
        questions: {
          spam: {
            type: 'noul',
            instructions:
              'Was `comment` written to advertise or to get a link seen, rather than by a real visitor to a page about `page_title`, a park guide for Rochester, NY?',
            criteria: {
              true: 'Spam: it promotes a product, service, website, clinic, casino, crypto scheme or SEO offer, or it is generic praise that could be pasted on any website.',
              false:
                'A real comment: a question, a correction, a memory or an opinion about this park, this post or parks in Rochester, even if short, misspelled or with a link to a real source.',
            },
          },
        },
      }),
      // The Commenter waits on this; a median call takes about 150 ms.
      signal: AbortSignal.timeout(3_000),
    });
    if (!response.ok) {
      throw new Error(`${response.status} ${await response.text()}`);
    }
    const result = (await response.json()) as {
      answers: { spam: { noul: number } };
    };
    return result.answers.spam.noul;
  } catch (error) {
    logger.warn('The spam check failed; the post goes on unchecked', {
      error: String(error),
    });
    return null;
  }
}

const collection = () => getFirestore().collection('comments');

function stored(
  id: string,
  data: FirebaseFirestore.DocumentData
): StoredComment {
  return {
    ...(data as Omit<StoredComment, 'id' | 'created'>),
    id,
    created: (data.created as Timestamp).toDate(),
  };
}

const store: CommentStore = {
  async add(comment) {
    return (await collection().add(comment)).id;
  },
  async get(id) {
    const doc = await collection().doc(id).get();
    return doc.exists ? stored(doc.id, doc.data()!) : undefined;
  },
  async inQueue() {
    const snapshot = await collection().where('state', '==', 'queue').get();
    return snapshot.docs.map((doc) => stored(doc.id, doc.data()));
  },
  async approved() {
    const snapshot = await collection().where('state', '==', 'approved').get();
    return snapshot.docs.map((doc) => stored(doc.id, doc.data()));
  },
  async removeWithReplies(id) {
    const replies = await collection().where('parent', '==', id).get();
    const batch = getFirestore().batch();
    for (const doc of replies.docs) batch.delete(doc.ref);
    batch.delete(collection().doc(id));
    await batch.commit();
  },
  async approve(id, body) {
    await collection().doc(id).update({ state: 'approved', body });
  },
  async remove(id) {
    await collection().doc(id).delete();
  },
};

export const comments = onRequest(
  {
    region: 'us-east4',
    secrets: [hmacKey, githubToken, moderationPassword, typesafeKey],
    minInstances: 0,
    invoker: 'public',
  },
  async (request, response) => {
    const result = await handle(
      {
        method: request.method,
        path: request.path,
        form: request.body ?? {},
        headers: request.headers as Record<string, string | undefined>,
        query: request.query as Record<string, string>,
      },
      {
        store,
        github,
        logError: (message, error) =>
          logger.error(message, { error: String(error) }),
        secrets: {
          hmacKey: hmacKey.value(),
          password: moderationPassword.value(),
        },
        spam,
        clock: () => new Date(),
      }
    );
    response.status(result.status).set(result.headers).send(result.body);
  }
);
