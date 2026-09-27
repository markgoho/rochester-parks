import { describe, expect, test } from 'bun:test';
import { project } from './municipalities';
import { outlinePaths, parkFrame } from './park-shapes';
import type { ParkOutline } from './types';

const source = { layer: 'test', ids: ['1'], fetched: '2026-09-27' };

/** A square about 400 m on a side, near Greece Town Hall. */
const square: [number, number][] = [
  [-77.7, 43.2],
  [-77.695, 43.2],
  [-77.695, 43.2036],
  [-77.7, 43.2036],
  [-77.7, 43.2],
];

describe('outlinePaths', () => {
  test('projects each ring into the county map space', () => {
    const [d] = outlinePaths({ polygons: [[square]], source });
    const { x, y } = project(43.2, -77.7);
    expect(d.startsWith(`M${x.toFixed(3)} ${y.toFixed(3)}L`)).toBe(true);
    expect(d.endsWith('Z')).toBe(true);
  });

  test('closes a ring with Z, not a repeated point', () => {
    const [d] = outlinePaths({ polygons: [[square]], source });
    expect(d.match(/[ML]/g)).toHaveLength(4);
  });

  test('keeps a hole in the same path as its outer ring', () => {
    const hole: [number, number][] = [
      [-77.699, 43.201],
      [-77.698, 43.201],
      [-77.698, 43.202],
      [-77.699, 43.201],
    ];
    const paths = outlinePaths({ polygons: [[square, hole]], source });
    expect(paths).toHaveLength(1);
    expect(paths[0].match(/M/g)).toHaveLength(2);
  });

  test('gives one path per polygon', () => {
    const shifted = square.map(([x, y]) => [x + 0.01, y] as [number, number]);
    const outline: ParkOutline = { polygons: [[square], [shifted]], source };
    expect(outlinePaths(outline)).toHaveLength(2);
  });
});

describe('parkFrame', () => {
  const paths = outlinePaths({ polygons: [[square]], source });

  test('frames the outline with room for its stroke', () => {
    const { viewBox } = parkFrame(paths);
    const [x, y, width, height] = viewBox.split(' ').map(Number);
    const { x: left } = project(43.2, -77.7);
    const { y: top } = project(43.2036, -77.7);
    expect(x).toBeLessThan(left);
    expect(y).toBeLessThan(top);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('gives the widest side in metres, to the nearest 10', () => {
    const { metres } = parkFrame(paths);
    expect(metres).toBeGreaterThanOrEqual(390);
    expect(metres).toBeLessThanOrEqual(420);
    expect(metres % 10).toBe(0);
  });
});
