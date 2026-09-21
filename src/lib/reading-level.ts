/**
 * The 8th-grade plain-prose standard for a sourced description (#150).
 *
 * Two rules, applied to a Park page body only:
 *
 *   1. Flesch-Kincaid grade 8.0 or lower, for a body of 50 words or more.
 *      Below that floor the formula is unstable, so a short body is judged
 *      on sentence length only.
 *   2. No sentence over 25 words, for every body regardless of length.
 */

export interface LongestSentence {
  words: number;
  text: string;
}

export interface Measurement {
  words: number;
  /** Undefined below the 50-word floor: the formula is unstable there. */
  grade: number | undefined;
  longestSentence: LongestSentence | undefined;
}

export interface CheckResult extends Measurement {
  passed: boolean;
  /** Why it failed, empty when passed. */
  reasons: string[];
}

export const GRADE_CEILING = 8.0;
export const SENTENCE_WORD_CEILING = 25;
export const GRADED_WORD_FLOOR = 50;

/**
 * Strips a Park page body to the prose a reader reads as a sentence: no
 * heading, no image, a link's URL dropped but its text kept, no italic
 * caption line (a photo credit or description standing alone on its own
 * line, immediately under an image).
 */
export function stripBody(markdown: string): string {
  return markdown
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (/^#{1,6}\s/.test(trimmed)) return false; // Heading.
      if (/^\*[^*]+\*$/.test(trimmed)) return false; // Italic caption, `*…*`.
      if (/^_[^_]+_$/.test(trimmed)) return false; // Italic caption, `_…_`.
      return true;
    })
    .join('\n')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // Image: markup, not prose.
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1'); // Link: keep the text, drop the URL.
}

/** A title, initial or unit that ends in a period without ending a sentence. */
const ABBREVIATIONS = new Set([
  'mr',
  'mrs',
  'ms',
  'dr',
  'st',
  'ave',
  'blvd',
  'rd',
  'ft',
  'mt',
  'vs',
  'etc',
  'jr',
  'sr',
  'no',
  'co',
  'inc',
  'gen',
  'rev',
  'sen',
  'gov',
  'lt',
  'col',
  'capt',
  'sgt',
]);

/** Splits stripped prose into sentences, protecting abbreviations and initials. */
export function splitSentences(text: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  const boundary = /[.!?]+["'”’)]*(?=\s|$)/g;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text))) {
    const end = match.index + match[0].length;
    const before = text.slice(start, match.index);
    const lastWordMatch = before.match(/([A-Za-z]+)\s*$/);
    const lastWord = lastWordMatch?.[1] ?? '';
    const isAbbreviation = ABBREVIATIONS.has(lastWord.toLowerCase());
    const isInitial = lastWord.length === 1 && /[A-Z]/.test(lastWord);
    if (isAbbreviation || isInitial) continue; // Not a sentence end.
    const sentence = text.slice(start, end).trim();
    if (sentence) sentences.push(sentence);
    start = end;
  }
  const rest = text.slice(start).trim();
  if (rest) sentences.push(rest);
  return sentences;
}

function wordsOf(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/** A widely-used heuristic vowel-group syllable count; adequate for a grade estimate. */
export function countSyllables(word: string): number {
  const bare = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!bare) return 0;
  if (bare.length <= 3) return 1;
  const trimmed = bare.replace(/e$/, '').replace(/^y/, '');
  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(groups ? groups.length : 0, 1);
}

/** Flesch-Kincaid Grade Level over already-stripped prose. */
export function fleschKincaidGrade(sentences: string[]): number {
  const words = sentences.flatMap(wordsOf);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  return (
    0.39 * (words.length / sentences.length) +
    11.8 * (syllables / words.length) -
    15.59
  );
}

/** Measures a stripped or raw Park page body against both rules. */
export function measure(markdown: string): Measurement {
  const prose = stripBody(markdown);
  const sentences = splitSentences(prose);
  const words = wordsOf(prose);
  const longest = sentences.reduce<LongestSentence | undefined>(
    (found, sentence) => {
      const count = wordsOf(sentence).length;
      return !found || count > found.words
        ? { words: count, text: sentence }
        : found;
    },
    undefined
  );
  const grade =
    words.length >= GRADED_WORD_FLOOR && sentences.length > 0
      ? fleschKincaidGrade(sentences)
      : undefined;
  return { words: words.length, grade, longestSentence: longest };
}

/** Applies the two rules to a measurement and explains any failure. */
export function evaluate(markdown: string): CheckResult {
  const result = measure(markdown);
  const reasons: string[] = [];
  if (result.grade !== undefined && result.grade > GRADE_CEILING) {
    reasons.push(
      `grade ${result.grade.toFixed(1)} is over ${GRADE_CEILING.toFixed(1)}`
    );
  }
  if (
    result.longestSentence &&
    result.longestSentence.words > SENTENCE_WORD_CEILING
  ) {
    reasons.push(
      `a ${result.longestSentence.words}-word sentence is over ${SENTENCE_WORD_CEILING}`
    );
  }
  return { ...result, passed: reasons.length === 0, reasons };
}
