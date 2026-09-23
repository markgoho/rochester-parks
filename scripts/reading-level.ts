/**
 * Runs the #150 reading-level standard (src/lib/reading-level.ts) over every
 * Park and Trail page body in the content tree, committed so the standard has
 * one definition (#159). A Trail page holds the same standard as a Park page
 * (#116): it is a write-up a reader reads, not a different kind of prose.
 *
 *   bun scripts/reading-level.ts
 *   bun scripts/reading-level.ts --all   # print every measured page, not only failures
 *
 * Exits non-zero when any non-exempt Park or Trail page fails either rule.
 */
import { globSync, readFileSync } from 'node:fs';
import matter from 'gray-matter';
import {
  isParkContainer,
  isParkType,
  isTrailType,
} from '../src/lib/park-types';
import { evaluate } from '../src/lib/reading-level';

interface FrontMatter {
  type?: string;
}

/** A path relative to `content/`, with no `_index.md`/`index.md`/`.md` suffix. */
function pageId(relativePath: string): string {
  return relativePath
    .replace(/\/(?:_index|index)\.md$/, '')
    .replace(/\.md$/, '');
}

/** A Park or Trail page: Park or Trail front matter, directly under its section. */
function isMeasuredPage(id: string, type: string | undefined): boolean {
  if (!isParkType(type) && !isTrailType(type)) return false;
  if (isParkContainer(`/${id}/`)) return false;
  const parentId = id.split('/').slice(0, -1).join('/');
  return isParkContainer(`/${parentId}/`);
}

/** The exemption list: one page id per line, `#` then the reason. */
function loadExemptions(path: string): Set<string> {
  let source: string;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    return new Set();
  }
  const ids = source
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('#')[0].trim());
  return new Set(ids);
}

function main(): void {
  const contentRoot = new URL('../content', import.meta.url).pathname;
  const exemptPath = new URL('./reading-level-exempt.txt', import.meta.url)
    .pathname;
  const exemptions = loadExemptions(exemptPath);
  const showAll = process.argv.includes('--all');

  const files = globSync(`${contentRoot}/**/*.md`).sort();
  let failures = 0;
  let measured = 0;

  for (const file of files) {
    const source = readFileSync(file, 'utf8');
    const { data, content } = matter(source);
    const front = data as FrontMatter;
    const id = pageId(file.slice(contentRoot.length + 1));
    if (!isMeasuredPage(id, front.type)) continue;
    measured++;

    const result = evaluate(content);
    const exempt = exemptions.has(id);

    if (showAll) {
      const grade = result.grade === undefined ? '—' : result.grade.toFixed(1);
      const status = exempt ? 'exempt' : result.passed ? 'pass' : 'FAIL';
      console.log(`${status}\t${grade}\t${id}`);
    }

    if (exempt || result.passed) continue;

    failures++;
    console.log(`FAIL ${id}`);
    for (const reason of result.reasons) console.log(`  ${reason}`);
    if (result.longestSentence) {
      console.log(
        `  longest sentence (${result.longestSentence.words} words): "${result.longestSentence.text}"`
      );
    }
  }

  console.log(
    `\n${measured} Park and Trail page bodies measured, ${exemptions.size} exempt, ${failures} failing.`
  );
  process.exit(failures > 0 ? 1 : 0);
}

main();
