/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import { globSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import { isParkContainer, isParkType } from './park-types.js';
import type { FrontMatter } from './types.js';

// Reads the real content tree, the way scripts/reading-level.ts does: the
// content loader builds on `import.meta.glob`, which only Vite provides.
const contentRoot = new URL('../../content', import.meta.url).pathname;

/** A path relative to `content/`, as a site URL. */
function urlOf(file: string): string {
  const path = file.slice(contentRoot.length);
  return path.replace(/(_index|index)\.md$/, '').replace(/\.md$/, '/');
}

const pages = globSync(`${contentRoot}/**/*.md`).map((file) => ({
  url: urlOf(file),
  frontMatter: matter(readFileSync(file, 'utf8')).data as FrontMatter,
}));

function parentUrl(url: string): string {
  const segments = url.split('/').filter(Boolean);
  return segments.length <= 1 ? '/' : `/${segments.slice(0, -1).join('/')}/`;
}

/**
 * Every section index that holds a Park page: each town, the City, the
 * County and the State. A village Park is filed under its town, so the town
 * holds it.
 */
const parkSections = [
  ...new Set(
    pages
      .filter(
        ({ url, frontMatter }) =>
          isParkType(frontMatter.type) &&
          !isParkContainer(url) &&
          isParkContainer(parentUrl(url))
      )
      .map(({ url }) => parentUrl(url))
  ),
].sort();

const sections = new Map(pages.map((page) => [page.url, page.frontMatter]));

describe('reservations', () => {
  test('finds the town, City, County and State sections', () => {
    expect(parkSections).toContain('/monroe-county-parks/');
    expect(parkSections).toContain('/rochester-city-parks/');
    expect(parkSections).toContain('/state-parks/');
    expect(parkSections).toContain('/town-parks/greece-parks/');
  });

  test.each(parkSections)('%s names who takes its bookings', (url) => {
    const reservations = sections.get(url)?.reservations;
    expect(reservations).toEqual({
      name: expect.any(String),
      url: expect.stringMatching(/^https:\/\//),
    });
    expect(reservations?.name.trim()).not.toBe('');
  });
});
