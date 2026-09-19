/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { ICON_PATHS, iconHref, iconSprite } from './icons.js';

describe('iconSprite', () => {
  test('holds one symbol for each icon, with its path', () => {
    const sprite = iconSprite();
    for (const [kind, d] of Object.entries(ICON_PATHS)) {
      expect(sprite).toContain(
        `<symbol id="${kind}" viewBox="0 0 256 256"><path d="${d}"/></symbol>`
      );
    }
  });

  test('is an SVG document of its own', () => {
    expect(iconSprite()).toStartWith(
      '<svg xmlns="http://www.w3.org/2000/svg">'
    );
  });
});

describe('iconHref', () => {
  test('points into the sprite file', () => {
    expect(iconHref('written')).toBe('/icons.svg#written');
  });
});
