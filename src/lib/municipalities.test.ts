/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { runsThrough } from './municipalities.js';

const SQUARE = {
  key: 'square',
  name: 'Square',
  paths: ['M0 0L10 0L10 10L0 10Z'],
};

describe('runsThrough', () => {
  test('finds a line that crosses the outline', () => {
    expect(runsThrough(SQUARE, 'M-5 5L15 5')).toBe(true);
  });

  test('finds a long leg that cuts a corner with no point inside', () => {
    expect(runsThrough(SQUARE, 'M-2 5L5 -2')).toBe(true);
  });

  test('passes over a line that runs just outside the border', () => {
    expect(runsThrough(SQUARE, 'M-0.5 0L-0.5 10')).toBe(false);
  });

  test('looks at every run of the line', () => {
    expect(runsThrough(SQUARE, 'M20 20L30 30M5 5L6 6')).toBe(true);
  });
});
