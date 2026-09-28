/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  baseMeta,
  egyptPark,
  highFalls,
  mendonPonds,
  westHigh,
} from './place-fixtures.js';
import { MAP_STYLE, parkShapeSvg, placeMapSvg } from './search-map.js';

describe('placeMapSvg', () => {
  test('a City Park with a Neighborhood shape draws the outline, water and dot', () => {
    const svg = placeMapSvg(westHigh, false);
    expect(svg).toMatch(
      /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" viewBox="[-\d. ]+">/
    );
    expect(svg).toContain('class="outline"');
    expect(svg).toContain('class="water river"');
    expect(svg).toContain('class="water canal"');
    expect(svg).toContain('class="dot"');
    expect(svg).not.toContain('class="village"');
  });

  test("a Town Park's map carries its villages", () => {
    const svg = placeMapSvg(egyptPark, false);
    expect(svg).toContain('class="village"');
    expect(svg).toContain('class="water canal"');
    expect(svg).not.toContain('class="water river"');
  });

  test('a Park with no water nearby draws no water path', () => {
    const svg = placeMapSvg(mendonPonds, false);
    expect(svg).not.toContain('class="water');
  });

  test('a Park with no point has no map', () => {
    expect(placeMapSvg({ ...baseMeta, geo: undefined }, false)).toBeUndefined();
  });

  test('a Park with no shape (the Park page falls back) has no map', () => {
    expect(placeMapSvg(highFalls, false)).toBeUndefined();
  });

  test('the map is a file on its own, with its styles inside it', () => {
    // Shown with `<img>` (#333), so it gets none of the page's CSS.
    const svg = placeMapSvg(egyptPark, false)!;
    expect(svg).toContain('<style>');
    expect(svg).toContain(`fill:${MAP_STYLE['--land']}`);
  });

  test('the dot keeps its whole circle inside the view box', () => {
    // An `<img>` clips at its edge, where the inline SVG could overflow.
    const svg = placeMapSvg(egyptPark, false)!;
    const [x, y, w, h] = /viewBox="([^"]+)"/
      .exec(svg)![1]
      .split(' ')
      .map(Number);
    const [cx, cy, r] = ['cx', 'cy', 'r'].map((a) =>
      Number(new RegExp(` ${a}="([^"]+)"`).exec(svg)![1])
    );
    expect(cx - r).toBeGreaterThan(x);
    expect(cy - r).toBeGreaterThan(y);
    expect(cx + r).toBeLessThan(x + w);
    expect(cy + r).toBeLessThan(y + h);
  });
});

describe('parkShapeSvg', () => {
  test("draws the Park's own land in a square, with its styles inside it", () => {
    const svg = parkShapeSvg(['M0 0L10 0L10 4Z', 'M20 0L22 0L22 2Z']);
    const [, , w, h] = /viewBox="([^"]+)"/.exec(svg)![1].split(' ').map(Number);
    expect(w).toBe(h);
    expect(svg.match(/class="land"/g)).toHaveLength(2);
    expect(svg).toContain(`fill:${MAP_STYLE['--park']}`);
  });
});

describe('MAP_STYLE', () => {
  test('each value is the value of its token in app.css', async () => {
    // A color token is set twice, the `hsl` fallback and then the `oklch`
    // value every current browser takes; the map takes the last one.
    const appCss = await Bun.file(
      new URL('../app.css', import.meta.url)
    ).text();
    for (const [token, value] of Object.entries(MAP_STYLE)) {
      const all = [
        ...appCss.matchAll(new RegExp(`\\s${token}:\\s*([^;]+);`, 'g')),
      ];
      expect({ token, value: all.at(-1)?.[1] }).toEqual({ token, value });
    }
  });
});
