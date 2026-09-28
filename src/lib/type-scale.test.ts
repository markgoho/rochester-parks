/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { Glob } from 'bun';

const src = new URL('../', import.meta.url).pathname;
const appCss = await Bun.file(`${src}app.css`).text();

// Every .css and .svelte file under src/, with its text.
const files: [string, string][] = [];
for await (const path of new Glob('**/*.{css,svelte}').scan(src)) {
  files.push([path, await Bun.file(src + path).text()]);
}

describe('the type scale', () => {
  test('defines each step from --step--2 to --step-5 with clamp()', () => {
    for (const step of ['-2', '-1', '0', '1', '2', '3', '4', '5']) {
      expect(appCss).toMatch(new RegExp(`--step-${step}: clamp\\(`));
    }
  });

  test('gives every font size a step, or leaves it to the parent', () => {
    // A step can be capped, as a heading is to fit its longest word. Map text
    // is in map units, and the map scales with its box.
    const step = /^(min\(\s*)?var\(--step-(-[12]|[0-5])\)/;
    const other = /^(var\(--text-map\)|inherit|100%)$/;
    const fixed: string[] = [];
    for (const [path, text] of files) {
      // A negative lookbehind keeps this off a custom property that merely
      // ends in "-font" or "-font-size", such as Pagefind's own --pf-font
      // (#318): only a real `font`/`font-size` declaration starts here.
      for (const [, value] of text.matchAll(
        /(?<![\w-])font(?:-size)?:\s*([^;]+);/g
      )) {
        const v = value.trim();
        if (!step.test(v) && !other.test(v)) fixed.push(`${path}: ${v}`);
      }
    }
    expect(fixed).toEqual([]);
  });
});
