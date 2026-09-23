/**
 * The Archive import's pure transform (#225): rows of the WordPress comment
 * export in, Firestore documents out. No file, network or clock here; the
 * runner, `scripts/archive-import.ts`, reads the files and writes the result.
 */
import { createHash } from 'node:crypto';

/** One row of the `RP Comments` CSV export, as its header names the columns. */
export interface ArchiveRow {
  author: string;
  email: string;
  url: string;
  IP: string;
  /** Zoneless, e.g. "2016-05-03 9:47:54"; read as Rochester time. */
  date: string;
  'Park Name': string;
  content: string;
  /** A WordPress comment id, or "0" for a top-level Comment. */
  parent: string;
}

/** One entry of `docs/research/comment-archive-park-map.json`. */
export interface ParkMapEntry {
  archive_name: string;
  /** The content file, e.g. "content/town-parks/x/_index.md". */
  path: string;
  kind: string;
}

/** One pair of `docs/research/comment-archive-reply-map.json`. */
export interface ReplyPair {
  reply_author: string;
  reply_date: string;
  parent_author: string;
  parent_date: string;
}

export interface ArchiveInput {
  rows: ArchiveRow[];
  parkMap: ParkMapEntry[];
  replyPairs: ReplyPair[];
  /** The owner's email, so the owner's rows are marked before email goes. */
  ownerEmail: string;
  /** Replacement bodies keyed by `author|date` (#208). */
  redactions: Record<string, string>;
}

/** An Archive comment as the `comments` collection stores it (#217). */
export interface ArchiveDocument {
  id: string;
  page: string;
  parent: string | null;
  state: 'approved';
  name: string;
  email: null;
  body: string;
  subject: null;
  created: Date;
  owner: boolean;
  flags: string[];
}

/** `archive-` plus the first 20 hex characters of SHA-256 of `author|date`. */
export function archiveId(author: string, date: string): string {
  const hash = createHash('sha256').update(`${author}|${date}`).digest('hex');
  return `archive-${hash.slice(0, 20)}`;
}

const key = (author: string, date: string) => `${author}|${date}`;

/** Empty email, a URL in the author cell, or WordPress's […] excerpt (#26). */
function isPingback(row: ArchiveRow): boolean {
  return (
    !row.email.trim() ||
    /https?:\/\/|www\./.test(row.author) ||
    /\[(?:…|&#8230;|&hellip;)\]/.test(row.content)
  );
}

/** A content file's page URL, the way the site's content loader maps it. */
function pageOf(path: string): string {
  return path
    .replace(/^content/, '')
    .replace(/(_index|index)\.md$/, '')
    .replace(/\.md$/, '/');
}

const NAMED: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  ndash: '–',
  mdash: '—',
};

/** Plain text: tags stripped, then entities decoded, URLs kept as text. */
function plainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(parseInt(code, 16))
    )
    .replace(
      /&([a-z]+);/gi,
      (match, name) => NAMED[name.toLowerCase()] ?? match
    )
    .trim();
}

/** A zoneless "YYYY-MM-DD H:MM:SS" read as America/New_York. */
function rochesterTime(date: string): Date {
  const match = date.match(
    /^(\d{4})-(\d{2})-(\d{2}) (\d{1,2}):(\d{2}):(\d{2})$/
  );
  if (!match) throw new Error(`Unreadable date: ${date}`);
  const [, y, mo, d, h, mi, s] = match.map(Number);
  const wall = Date.UTC(y, mo - 1, d, h, mi, s);
  // New York's offset at a moment, from how the moment reads there. Two
  // passes settle the offset on either side of a daylight-saving change.
  const offsetAt = (instant: number) => {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
        .formatToParts(instant)
        .map((part) => [part.type, Number(part.value)])
    );
    const asRead = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    return asRead - instant;
  };
  let instant = wall - offsetAt(wall);
  instant = wall - offsetAt(instant);
  return new Date(instant);
}

/**
 * Rows in, documents out, in row order. Pingbacks are dropped. Every other
 * row must place through the park map and, if it answers another, pair
 * through the reply map; any row that cannot, and any redaction that matches
 * no row, fails the whole run, so nothing is half-imported.
 */
export function transformArchive(input: ArchiveInput): ArchiveDocument[] {
  const pages = new Map(
    input.parkMap.map((entry) => [entry.archive_name, pageOf(entry.path)])
  );
  const parents = new Map(
    input.replyPairs.map((pair) => [
      key(pair.reply_author, pair.reply_date),
      archiveId(pair.parent_author, pair.parent_date),
    ])
  );
  const owner = input.ownerEmail.trim().toLowerCase();
  const unused = new Set(Object.keys(input.redactions));

  const documents = input.rows
    .filter((row) => !isPingback(row))
    .map((row): ArchiveDocument => {
      const page = pages.get(row['Park Name']);
      if (!page) {
        throw new Error(`No page for "${row['Park Name']}" (${row.author})`);
      }
      const natural = key(row.author, row.date);
      const answers = row.parent.trim() !== '' && row.parent.trim() !== '0';
      const parent = parents.get(natural) ?? null;
      if (answers && !parent) {
        throw new Error(`No parent paired for the Reply by ${row.author}`);
      }
      unused.delete(natural);
      return {
        id: archiveId(row.author, row.date),
        page,
        parent,
        state: 'approved',
        name: row.author.trim(),
        email: null,
        body: input.redactions[natural] ?? plainText(row.content),
        subject: null,
        created: rochesterTime(row.date),
        owner: row.email.trim().toLowerCase() === owner,
        flags: [],
      };
    });

  if (unused.size) {
    throw new Error(`Redactions match no row: ${[...unused].join(', ')}`);
  }
  return documents;
}

/** The counts #225 fixes for the real sheet. */
export const EXPECTED = { rows: 127, replies: 30, owner: 27 };

/**
 * Checks every count, and that every parent is in the set, before the first
 * write; a mismatch throws and nothing is written. Each document is written
 * under its derived id, so a re-run overwrites and never duplicates.
 */
export async function importArchive(
  documents: ArchiveDocument[],
  set: (id: string, document: Omit<ArchiveDocument, 'id'>) => Promise<void>,
  expected = EXPECTED
): Promise<void> {
  const ids = new Set(documents.map((doc) => doc.id));
  const problems = [
    [documents.length, expected.rows, 'rows'],
    [
      documents.filter((doc) => doc.parent).length,
      expected.replies,
      'with a parent',
    ],
    [documents.filter((doc) => doc.owner).length, expected.owner, 'owner rows'],
  ]
    .filter(([found, want]) => found !== want)
    .map(([found, want, what]) => `${found} ${what}, expected ${want}`);
  for (const doc of documents) {
    if (doc.parent && !ids.has(doc.parent)) {
      problems.push(`${doc.id} answers ${doc.parent}, which is not in the set`);
    }
  }
  if (ids.size !== documents.length) problems.push('duplicate ids');
  if (problems.length) {
    throw new Error(`Nothing written. ${problems.join('; ')}.`);
  }
  for (const { id, ...document } of documents) await set(id, document);
}

/** A small RFC 4180 reader: quoted fields may hold commas, quotes and breaks. */
export function parseCsv(source: string): Record<string, string>[] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      record.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  const [header, ...rows] = records;
  return rows.map((cells) =>
    Object.fromEntries(header.map((name, i) => [name, cells[i] ?? '']))
  );
}
