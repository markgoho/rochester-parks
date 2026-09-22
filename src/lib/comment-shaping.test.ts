/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { shapeComments, type StoredComment } from './comment-shaping.js';

const PAGE = '/town-parks/riga-parks/sanford-road-park/';
const OTHER = '/trails/erie-canal/';

/** A full stored document, private fields and all. */
function stored(
  id: string,
  overrides: Partial<StoredComment> = {}
): StoredComment & { id: string } {
  return {
    id,
    page: PAGE,
    parent: null,
    state: 'approved',
    name: 'Barbara',
    email: 'barbara@example.com',
    body: 'How do I reserve the lodge?',
    subject: 'reservation-question',
    created: new Date('2015-06-14T16:00:00Z'),
    owner: false,
    flags: ['links'],
    ...overrides,
  };
}

describe('shapeComments', () => {
  test('keeps only what a reader may see', () => {
    const shaped = shapeComments([
      { ...stored('a'), ip: '203.0.113.9', userAgent: 'x' } as never,
    ]);
    expect(shaped).toEqual({
      [PAGE]: [
        {
          id: 'a',
          name: 'Barbara',
          body: 'How do I reserve the lodge?',
          created: '2015-06-14',
          owner: false,
          replies: [],
        },
      ],
    });
    const text = JSON.stringify(shaped);
    for (const secret of [
      'barbara@example.com',
      '203.0.113.9',
      'reservation-question',
      'links',
      'approved',
    ]) {
      expect(text).not.toContain(secret);
    }
  });

  test('groups Comments by page', () => {
    const shaped = shapeComments([
      stored('a'),
      stored('b', { page: OTHER }),
      stored('c'),
    ]);
    expect(Object.keys(shaped).sort()).toEqual([PAGE, OTHER].sort());
    expect(shaped[PAGE].map((c) => c.id)).toEqual(['a', 'c']);
    expect(shaped[OTHER].map((c) => c.id)).toEqual(['b']);
  });

  test('orders Comments and Replies oldest first', () => {
    const shaped = shapeComments([
      stored('late', { created: new Date('2020-01-01T12:00:00Z') }),
      stored('early', { created: new Date('2012-01-01T12:00:00Z') }),
      stored('r2', {
        parent: 'early',
        created: new Date('2013-05-01T12:00:00Z'),
      }),
      stored('r1', {
        parent: 'early',
        created: new Date('2012-02-01T12:00:00Z'),
      }),
    ]);
    expect(shaped[PAGE].map((c) => c.id)).toEqual(['early', 'late']);
    expect(shaped[PAGE][0].replies.map((r) => r.id)).toEqual(['r1', 'r2']);
  });

  test('drops a Reply whose parent is not in the set', () => {
    const shaped = shapeComments([
      stored('a'),
      stored('orphan', { parent: 'gone' }),
    ]);
    expect(shaped[PAGE]).toHaveLength(1);
    expect(shaped[PAGE][0].replies).toEqual([]);
  });

  test('a page with only an orphan Reply has no entry', () => {
    expect(shapeComments([stored('orphan', { parent: 'gone' })])).toEqual({});
  });

  test('carries the owner mark through, on a Comment and on a Reply', () => {
    const shaped = shapeComments([
      stored('a', { owner: true, name: 'Mark' }),
      stored('r', { parent: 'a', owner: true }),
    ]);
    expect(shaped[PAGE][0].owner).toBe(true);
    expect(shaped[PAGE][0].replies[0].owner).toBe(true);
  });

  test('dates the Comment on the day it was in Rochester', () => {
    // 02:00 UTC on 1 March is still 28 February in New York.
    const shaped = shapeComments([
      stored('a', { created: new Date('2021-03-01T02:00:00Z') }),
    ]);
    expect(shaped[PAGE][0].created).toBe('2021-02-28');
  });
});
