/**
 * Reads the Approved Comments from Firestore and writes them, shaped per
 * page, to `generated/comments.json` for the build to read (ADR-0012). The
 * deploy workflow runs it before `bun run build`. Only the shaped output
 * reaches the disk, so no email, IP or Subject is ever written here.
 *
 *   FIREBASE_SERVICE_ACCOUNT='<key JSON>' bun scripts/fetch-comments.ts
 *   bun scripts/fetch-comments.ts   # Application Default Credentials
 *
 * Any error exits non-zero and writes nothing. In the deploy that fails the
 * job, because an empty file would take every Comment off the live site.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { applicationDefault, cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, type Timestamp } from 'firebase-admin/firestore';
import { shapeComments, type StoredComment } from '../src/lib/comment-shaping';

const key = process.env.FIREBASE_SERVICE_ACCOUNT;
initializeApp({
  credential: key ? cert(JSON.parse(key)) : applicationDefault(),
  projectId: 'rochester-parks',
});

const snapshot = await getFirestore()
  .collection('comments')
  .where('state', '==', 'approved')
  .get();

const documents = snapshot.docs.map((doc) => {
  const data = doc.data() as Omit<StoredComment, 'created'> & {
    created: Timestamp;
  };
  return { ...data, id: doc.id, created: data.created.toDate() };
});
const pages = shapeComments(documents);

const out = new URL('../generated/', import.meta.url);
mkdirSync(out, { recursive: true });
writeFileSync(new URL('comments.json', out), JSON.stringify(pages));

const count = Object.values(pages)
  .flat()
  .reduce((n, comment) => n + 1 + comment.replies.length, 0);
console.log(
  `Wrote ${count} Approved Comments on ${Object.keys(pages).length} pages.`
);
