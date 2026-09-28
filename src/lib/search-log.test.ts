/// <reference types="bun" />
// The search-log module (#322) is a plain ES module in static/, not
// src/lib: it runs unbundled in the browser on pages with `csr = false`
// (see static/search.js). It is tested from here, not from static/ itself,
// so the test file is never among the assets adapter-static copies to
// public/ verbatim.
import { describe, expect, test } from 'bun:test';
import { createSearchLog } from '../../static/search-log.js';

describe('createSearchLog', () => {
  test('a term typed past sends only the term the reader stopped on', () => {
    const log = createSearchLog();
    log.search('gene');
    log.results(27);
    log.search('genesee');
    log.results(21);
    expect(log.closed()).toEqual({ term: 'genesee', results: 21 });
  });

  test('an empty search from clear, Escape or close sends nothing', () => {
    const log = createSearchLog();
    log.search('');
    log.results(0);
    expect(log.closed()).toBeUndefined();
  });

  test('the clear button keeps the count of the term cleared, not 0', () => {
    const log = createSearchLog();
    log.search('genesee');
    log.results(21);
    log.search(''); // the Clear button, same as Escape and close
    log.results(0); // Pagefind's own reset search fires this too
    expect(log.closed()).toEqual({ term: 'genesee', results: 21 });
  });

  test('opening a result sends the kept term', () => {
    const log = createSearchLog();
    log.search('durand eastman');
    log.results(4);
    expect(log.opened()).toEqual({ term: 'durand eastman', results: 4 });
  });

  test('pagehide sends the kept term', () => {
    const log = createSearchLog();
    log.search('trail');
    log.results(5);
    expect(log.left()).toEqual({ term: 'trail', results: 5 });
  });

  test('a second close after a send sends nothing', () => {
    const log = createSearchLog();
    log.search('genesee');
    log.results(21);
    expect(log.closed()).toEqual({ term: 'genesee', results: 21 });
    expect(log.closed()).toBeUndefined();
  });

  test('the term filter drops an email, a phone number and a long text', () => {
    const email = createSearchLog();
    email.search('reader@example.com');
    email.results(0);
    expect(email.closed()).toBeUndefined();

    const phone = createSearchLog();
    phone.search('5855551234');
    phone.results(0);
    expect(phone.closed()).toBeUndefined();

    const longText = createSearchLog();
    longText.search(
      'a park with a splash pad and a shelter near the river trail'
    );
    longText.results(0);
    expect(longText.closed()).toBeUndefined();
  });

  test('the term filter keeps and lower-cases an ordinary place name', () => {
    const durandEastman = createSearchLog();
    durandEastman.search('Durand Eastman');
    durandEastman.results(1);
    expect(durandEastman.closed()).toEqual({
      term: 'durand eastman',
      results: 1,
    });

    const ward = createSearchLog();
    ward.search('19th Ward');
    ward.results(6);
    expect(ward.closed()).toEqual({ term: '19th ward', results: 6 });
  });
});
