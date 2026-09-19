/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { waterIn } from './water.js';

const BOX = { x: 0, y: 0, width: 10, height: 10 };

describe('waterIn', () => {
  test('keeps a line inside the box as it is', () => {
    expect(waterIn('M1 1L5 5L9 1', BOX)).toBe('M1 1L5 5L9 1');
  });

  test('cuts a line where it crosses a side', () => {
    expect(waterIn('M5 5L15 5', BOX)).toBe('M5 5L10 5');
    expect(waterIn('M5 -5L5 5', BOX)).toBe('M5 0L5 5');
  });

  test('cuts a line where it crosses the bottom', () => {
    expect(waterIn('M5 5L5 20', BOX)).toBe('M5 5L5 10');
  });

  test('gives nothing for a line that misses the box', () => {
    expect(waterIn('M20 20L30 30', BOX)).toBe('');
  });

  test('starts a new run where the line comes back in', () => {
    expect(waterIn('M5 5L15 5L15 8L5 8', BOX)).toBe('M5 5L10 5M10 8L5 8');
  });
});
