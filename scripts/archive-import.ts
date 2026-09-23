/**
 * Imports the 127 Archive comments into Firestore, Approved (#225). Run once
 * by the owner; the next site build publishes them. No announcement issue
 * and no deploy per row.
 *
 *   OWNER_EMAIL=... bun scripts/archive-import.ts <path to RP Comments.csv>
 *   OWNER_EMAIL=... bun scripts/archive-import.ts <csv> --dry-run
 *
 * The CSV is the owner's download of the Google Sheet `RP Comments`, kept
 * outside the repo: it holds emails and IPs. Auth is Application Default
 * Credentials, always against the rochester-parks project. Every count is
 * checked before the first write, and a re-run overwrites by id.
 */
import { readFileSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  importArchive,
  parseCsv,
  transformArchive,
  type ArchiveRow,
} from './archive-transform';

const [csvPath] = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const dryRun = process.argv.includes('--dry-run');
const ownerEmail = process.env.OWNER_EMAIL ?? '';
if (!csvPath || !ownerEmail) {
  console.error(
    'Usage: OWNER_EMAIL=... bun scripts/archive-import.ts <csv> [--dry-run]'
  );
  process.exit(1);
}

const json = (path: string) =>
  JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

const documents = transformArchive({
  rows: parseCsv(readFileSync(csvPath, 'utf8')) as unknown as ArchiveRow[],
  parkMap: json('docs/research/comment-archive-park-map.json').rows,
  replyPairs: json('docs/research/comment-archive-reply-map.json').pairs,
  redactions: json('docs/research/comment-archive-redactions.json').redactions,
  ownerEmail,
});

let written = 0;
if (dryRun) {
  await importArchive(documents, async () => void written++);
  console.log(
    `Dry run: all checks pass; ${written} documents would be written.`
  );
} else {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'rochester-parks',
  });
  const firestore = getFirestore();
  const comments = firestore.collection('comments');
  // One batch, so the set lands whole or not at all (127 is under the
  // batch limit of 500).
  const batch = firestore.batch();
  await importArchive(documents, async (id, document) => {
    batch.set(comments.doc(id), document);
    written++;
  });
  await batch.commit();
  console.log(`Wrote ${written} Archive comments, Approved.`);
}
