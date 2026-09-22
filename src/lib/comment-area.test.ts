/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { commentAreaOf } from './comment-area.js';

const riga = { name: 'Town of Riga', url: 'https://www.townofriga.com/' };

describe('commentAreaOf', () => {
  test('a Park page takes Comments, with its section link', () => {
    expect(
      commentAreaOf({
        layout: 'park-single',
        url: '/town-parks/riga-parks/sanford-road-park/',
        frontMatter: {},
        reservations: riga,
      })
    ).toEqual({ open: true, reservations: riga, comments: [] });
  });

  test('a Park in a section with no link takes Comments with no link', () => {
    expect(
      commentAreaOf({
        layout: 'park-single',
        url: '/state-parks/x/',
        frontMatter: {},
      })
    ).toEqual({ open: true, comments: [] });
  });

  test('a Trail page takes Comments but never a reservation link', () => {
    expect(
      commentAreaOf({
        layout: 'trail-single',
        url: '/trails/erie-canal/',
        frontMatter: {},
        reservations: riga,
      })
    ).toEqual({ open: true, comments: [] });
  });

  test('a Blog post takes Comments', () => {
    expect(
      commentAreaOf({
        layout: 'default-single',
        url: '/blog/what-makes-a-rochester-park-great/',
        frontMatter: {},
      })
    ).toEqual({ open: true, comments: [] });
  });

  test('About, list and index pages take no Comments', () => {
    for (const [layout, url] of [
      ['default-single', '/about/'],
      ['default-list', '/blog/'],
      ['park-list', '/town-parks/riga-parks/'],
      ['home', '/'],
    ] as const) {
      expect(commentAreaOf({ layout, url, frontMatter: {} })).toBeUndefined();
    }
  });

  test('comments: false closes the form and keeps the notice link', () => {
    expect(
      commentAreaOf({
        layout: 'park-single',
        url: '/town-parks/riga-parks/sanford-road-park/',
        frontMatter: { comments: false },
        reservations: riga,
      })
    ).toEqual({ open: false, reservations: riga, comments: [] });
  });

  test('comments: false cannot open a page kind that takes none', () => {
    expect(
      commentAreaOf({
        layout: 'default-single',
        url: '/about/',
        frontMatter: { comments: false },
      })
    ).toBeUndefined();
    expect(
      commentAreaOf({
        layout: 'default-single',
        url: '/about/',
        frontMatter: { comments: true },
      })
    ).toBeUndefined();
  });
});
