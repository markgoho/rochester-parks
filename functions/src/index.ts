import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { onRequest } from 'firebase-functions/v2/https';
import { handle, type CommentStore } from './handler.js';

/**
 * The one comments Function (#217, ADR-0012): 2nd gen, `us-east4` beside the
 * database, the default service account, no key material and no warm
 * instance. A Hosting rewrite sends `/comment` here.
 */

initializeApp();

/** The page-token key. The same value is the deploy workflow's secret. */
const hmacKey = defineSecret('COMMENT_HMAC_KEY');

const store: CommentStore = {
  async add(comment) {
    const doc = await getFirestore().collection('comments').add(comment);
    return doc.id;
  },
};

export const comments = onRequest(
  {
    region: 'us-east4',
    secrets: [hmacKey],
    minInstances: 0,
    invoker: 'public',
  },
  async (request, response) => {
    const result = await handle(
      { method: request.method, path: request.path, form: request.body ?? {} },
      { store, secrets: { hmacKey: hmacKey.value() }, clock: () => new Date() }
    );
    response.status(result.status).set(result.headers).send(result.body);
  }
);
