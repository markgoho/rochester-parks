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

  test('gives every font-size a step, or leaves it to the parent', () => {
    // Map text is in map units, and the map scales with its box.
    const allowed =
      /^(var\(--step--?\d\)|var\(--text-map\)|inherit|100%)$/;
    const fixed: string[] = [];
    for (const [path, text] of files) {
      for (const [, value] of text.matchAll(/font-size:\s*([^;]+);/g)) {
        if (!allowed.test(value.trim())) fixed.push(`${path}: ${value}`);
      }
    }
    expect(fixed).toEqual([]);
  });
});
