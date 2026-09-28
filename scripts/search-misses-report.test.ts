/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { pagesToMisses, type EventRow } from './search-misses-report';

function row(
  term: string,
  count: number,
  results: string | number = '0'
): EventRow {
  return { name: 'Search', meta: { term, results }, visitors: count, count };
}

describe('pagesToMisses', () => {
  test('an empty result gives an empty list', () => {
    expect(pagesToMisses([])).toEqual([]);
    expect(pagesToMisses([[]])).toEqual([]);
  });

  test('one page, one term', () => {
    expect(pagesToMisses([[row('durand eastman', 3)]])).toEqual([
      { term: 'durand eastman', count: 3 },
    ]);
  });

  test('most first, across several pages', () => {
    const pages = [
      [row('oatka creek', 2), row('19th ward', 9)],
      [row('splash pad', 5)],
    ];
    expect(pagesToMisses(pages)).toEqual([
      { term: '19th ward', count: 9 },
      { term: 'splash pad', count: 5 },
      { term: 'oatka creek', count: 2 },
    ]);
  });

  test('the same term repeated, on one page or across pages, is one summed row', () => {
    const pages = [[row('genesee', 4), row('genesee', 1)], [row('genesee', 2)]];
    expect(pagesToMisses(pages)).toEqual([{ term: 'genesee', count: 7 }]);
  });

  test('a tie in count breaks alphabetically', () => {
    expect(pagesToMisses([[row('trail', 3), row('bike path', 3)]])).toEqual([
      { term: 'bike path', count: 3 },
      { term: 'trail', count: 3 },
    ]);
  });

  test('a row with no term, or an empty term, is ignored', () => {
    const noTerm: EventRow = {
      name: 'Search',
      meta: { results: '0' },
      visitors: 1,
      count: 1,
    };
    const blankTerm = row('', 1);
    expect(pagesToMisses([[noTerm, blankTerm, row('creek', 1)]])).toEqual([
      { term: 'creek', count: 1 },
    ]);
  });

  test('a numeric meta value in a fixture does not break the term read', () => {
    // results is a numeric string on the wire ("results":"3"); a fixture
    // may write it as either shape, and only meta.term matters here.
    expect(pagesToMisses([[row('creek', 2, 0)]])).toEqual([
      { term: 'creek', count: 2 },
    ]);
  });

  test('a row whose results is not 0 is not a miss, even if the API sent it', () => {
    const page = [
      row('creek', 1, '0'),
      row('trail', 1, 0),
      row('genesee', 1, '3'),
    ];
    expect(pagesToMisses([page])).toEqual([
      { term: 'creek', count: 1 },
      { term: 'trail', count: 1 },
    ]);
  });
});
