/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  archiveId,
  importArchive,
  parseCsv,
  transformArchive,
  type ArchiveInput,
  type ArchiveRow,
} from './archive-transform';

// Synthetic rows only: the real sheet holds personal data and never enters
// the repo or a test.
const OWNER = 'owner@example.org';

function row(overrides: Partial<ArchiveRow>): ArchiveRow {
  return {
    author: 'Terri',
    email: 'terri@example.com',
    url: '',
    IP: '203.0.113.7',
    date: '2012-10-09 15:44:56',
    'Park Name': 'Adeline Park',
    content: 'Nice park.',
    parent: '0',
    ...overrides,
  };
}

function input(rows: ArchiveRow[], more: Partial<ArchiveInput> = {}) {
  return {
    rows,
    ownerEmail: OWNER,
    parkMap: [
      {
        archive_name: 'Adeline Park',
        path: 'content/town-parks/greece-parks/adeline-park/_index.md',
        kind: 'park',
      },
      {
        archive_name: 'Gates Town Park playground',
        path: 'content/town-parks/gates-parks/first-responders-park/_index.md',
        kind: 'attachment',
      },
      {
        archive_name: 'Badgerow Park North',
        path: 'content/town-parks/greece-parks/veterans-memorial-park/_index.md',
        kind: 'park',
      },
      {
        archive_name: 'What makes a Rochester park great?',
        path: 'content/blog/what-makes-a-rochester-park-great.md',
        kind: 'page',
      },
    ],
    replyPairs: [],
    redactions: {},
    ...more,
  };
}

describe('transformArchive', () => {
  test('writes an Approved document with no email, IP or Subject', () => {
    const [doc] = transformArchive(input([row({})]));
    expect(doc).toEqual({
      id: archiveId('Terri', '2012-10-09 15:44:56'),
      page: '/town-parks/greece-parks/adeline-park/',
      parent: null,
      state: 'approved',
      name: 'Terri',
      email: null,
      body: 'Nice park.',
      subject: null,
      created: new Date('2012-10-09T19:44:56Z'),
      owner: false,
      flags: [],
    });
    const text = JSON.stringify(doc);
    expect(text).not.toContain('terri@example.com');
    expect(text).not.toContain('203.0.113.7');
  });

  test('drops Pingbacks: empty email, a URL author, or […] content', () => {
    const docs = transformArchive(
      input([
        row({ author: 'a', email: '' }),
        row({
          author: 'https://blog.example/post',
          date: '2013-01-01 1:00:00',
        }),
        row({ author: 'b', content: 'Some site linked here [&#8230;] more' }),
        row({ author: 'c', content: 'Also […] here' }),
        row({ author: 'kept' }),
      ])
    );
    expect(docs.map((doc) => doc.name)).toEqual(['kept']);
  });

  test('places a row through the map, attachment and merged pages included', () => {
    const docs = transformArchive(
      input([
        row({ author: 'a', 'Park Name': 'Gates Town Park playground' }),
        row({ author: 'b', 'Park Name': 'Badgerow Park North' }),
        row({ author: 'c', 'Park Name': 'What makes a Rochester park great?' }),
      ])
    );
    expect(docs.map((doc) => doc.page)).toEqual([
      '/town-parks/gates-parks/first-responders-park/',
      '/town-parks/greece-parks/veterans-memorial-park/',
      '/blog/what-makes-a-rochester-park-great/',
    ]);
  });

  test('an unplaced name fails the whole run', () => {
    expect(() =>
      transformArchive(input([row({ 'Park Name': 'Nowhere Park' })]))
    ).toThrow('Nowhere Park');
  });

  test('marks the owner by email, not by first name', () => {
    const docs = transformArchive(
      input([
        row({ author: 'Mark Goho', email: 'Owner@Example.org' }),
        row({ author: 'Mark', email: OWNER, date: '2013-01-01 1:00:00' }),
        row({ author: 'Mark Jesse', email: 'mj@example.com' }),
      ])
    );
    expect(docs.map((doc) => [doc.name, doc.owner])).toEqual([
      ['Mark Goho', true],
      ['Mark', true],
      ['Mark Jesse', false],
    ]);
  });

  test('pairs a Reply to its derived parent id', () => {
    const docs = transformArchive(
      input(
        [
          row({ author: 'Terri', date: '2012-10-09 15:44:56' }),
          row({
            author: 'Mark',
            email: OWNER,
            date: '2012-10-10 19:57:39',
            parent: '97',
          }),
        ],
        {
          replyPairs: [
            {
              reply_author: 'Mark',
              reply_date: '2012-10-10 19:57:39',
              parent_author: 'Terri',
              parent_date: '2012-10-09 15:44:56',
            },
          ],
        }
      )
    );
    expect(docs[1].parent).toBe(archiveId('Terri', '2012-10-09 15:44:56'));
    expect(docs[1].parent).toBe(docs[0].id);
    expect(docs[0].parent).toBeNull();
  });

  test('a row with a parent but no pair fails', () => {
    expect(() =>
      transformArchive(input([row({ author: 'x', parent: '12' })]))
    ).toThrow('x');
  });

  test('decodes entities and strips tags, keeping URLs as text', () => {
    const [doc] = transformArchive(
      input([
        row({
          content:
            'It&#8217;s <b>great</b> &amp; free &lt;3 see <a href="https://a.example">https://a.example</a>',
        }),
      ])
    );
    expect(doc.body).toBe('It’s great & free <3 see https://a.example');
  });

  test('applies the redaction file by author and date', () => {
    const [doc] = transformArchive(
      input([row({ content: 'Call 585-555-0100.' })], {
        redactions: {
          'Terri|2012-10-09 15:44:56': 'Call [phone removed].',
        },
      })
    );
    expect(doc.body).toBe('Call [phone removed].');
  });

  test('an unused redaction fails, so a typo cannot skip one', () => {
    expect(() =>
      transformArchive(
        input([row({})], { redactions: { 'Nobody|2000-01-01 0:00:00': 'x' } })
      )
    ).toThrow('Nobody');
  });

  test('reads a zoneless date as Rochester time, summer and winter', () => {
    const docs = transformArchive(
      input([
        row({ author: 'w', date: '2016-01-15 9:47:54' }),
        row({ author: 's', date: '2016-07-15 9:47:54' }),
      ])
    );
    expect(docs[0].created.toISOString()).toBe('2016-01-15T14:47:54.000Z');
    expect(docs[1].created.toISOString()).toBe('2016-07-15T13:47:54.000Z');
  });

  test('the same input gives the same ids', () => {
    const rows = [row({}), row({ author: 'Other' })];
    expect(transformArchive(input(rows)).map((doc) => doc.id)).toEqual(
      transformArchive(input(rows)).map((doc) => doc.id)
    );
    expect(archiveId('Terri', '2012-10-09 15:44:56')).toMatch(
      /^archive-[0-9a-f]{20}$/
    );
  });
});

describe('parseCsv', () => {
  test('reads quoted fields with commas, quotes and line breaks', () => {
    expect(
      parseCsv('author,content\nA,"one, ""two""\nthree"\nB,plain\n')
    ).toEqual([
      { author: 'A', content: 'one, "two"\nthree' },
      { author: 'B', content: 'plain' },
    ]);
  });
});

describe('importArchive', () => {
  const docs = (count: number, replies = 0, owners = 0) =>
    Array.from({ length: count }, (_, i) => ({
      id: `archive-${i}`,
      page: '/p/',
      parent: i > 0 && i <= replies ? 'archive-0' : null,
      state: 'approved' as const,
      name: `n${i}`,
      email: null,
      body: 'b',
      subject: null,
      created: new Date(0),
      owner: i < owners,
      flags: [],
    }));
  const expected = { rows: 3, replies: 1, owner: 1 };

  test('stops before any write when a count does not match', async () => {
    const written = new Map<string, unknown>();
    const set = async (id: string, doc: unknown) => void written.set(id, doc);
    await expect(importArchive(docs(2, 1, 1), set, expected)).rejects.toThrow(
      '3'
    );
    await expect(importArchive(docs(3, 0, 1), set, expected)).rejects.toThrow();
    await expect(importArchive(docs(3, 1, 0), set, expected)).rejects.toThrow();
    expect(written.size).toBe(0);
  });

  test('stops when a parent is missing', async () => {
    const written = new Map<string, unknown>();
    const broken = docs(3, 1, 1).map((doc, i) =>
      i === 1 ? { ...doc, parent: 'archive-gone' } : doc
    );
    await expect(
      importArchive(
        broken,
        async (id, doc) => void written.set(id, doc),
        expected
      )
    ).rejects.toThrow('archive-gone');
    expect(written.size).toBe(0);
  });

  test('a second run writes no new documents', async () => {
    const written = new Map<string, unknown>();
    const set = async (id: string, doc: unknown) => void written.set(id, doc);
    await importArchive(docs(3, 1, 1), set, expected);
    await importArchive(docs(3, 1, 1), set, expected);
    expect(written.size).toBe(3);
  });
});
