/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { topicsOf } from './topics.js';

describe('topicsOf', () => {
  test('no h2 headings gives no topics', () => {
    expect(topicsOf('<p>Just prose.</p>')).toEqual([]);
  });

  test('one h2 heading is still below the two-or-more rule', () => {
    expect(topicsOf('<h2 id="history">History</h2>')).toEqual([]);
  });

  test('two h2 headings are both returned, in order', () => {
    expect(
      topicsOf(
        '<h2 id="history">History</h2><p>Text.</p><h2 id="trails">Trails</h2>'
      )
    ).toEqual([
      { id: 'history', title: 'History' },
      { id: 'trails', title: 'Trails' },
    ]);
  });

  test('strips inline tags and keeps smartypants punctuation in the title', () => {
    expect(
      topicsOf(
        '<h2 id="visitors-rules">Visitor’s <em>Rules</em></h2><h2 id="trails">Trails</h2>'
      )
    ).toEqual([
      { id: 'visitors-rules', title: 'Visitor’s Rules' },
      { id: 'trails', title: 'Trails' },
    ]);
  });

  test('an extra topic can push one heading over the two-or-more rule', () => {
    expect(
      topicsOf('<h2 id="history">History</h2>', [
        { id: 'facilities', title: 'Facilities' },
      ])
    ).toEqual([
      { id: 'history', title: 'History' },
      { id: 'facilities', title: 'Facilities' },
    ]);
  });

  test('an h1 or an h3 is not picked up as a topic', () => {
    expect(
      topicsOf(
        '<h1 id="not-a-topic">Not a topic</h1><h2 id="history">History</h2><h3 id="also-not">Also not</h3><h2 id="trails">Trails</h2>'
      )
    ).toEqual([
      { id: 'history', title: 'History' },
      { id: 'trails', title: 'Trails' },
    ]);
  });
});
