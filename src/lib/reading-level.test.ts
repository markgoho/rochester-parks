/// <reference types="bun" />
import { describe, expect, test } from 'bun:test';
import {
  countSyllables,
  evaluate,
  fleschKincaidGrade,
  measure,
  splitSentences,
  stripBody,
} from './reading-level.js';

describe('stripBody', () => {
  test('drops headings, images and italic captions, keeps link text', () => {
    const markdown = [
      '## A heading',
      '',
      '![A park bench](bench.jpg)',
      '',
      '*A caption under the photo*',
      '',
      'Read the [official page](https://example.com/parks) for hours.',
    ].join('\n');
    const stripped = stripBody(markdown);
    expect(stripped).not.toContain('heading');
    expect(stripped).not.toContain('bench.jpg');
    expect(stripped).not.toContain('caption under the photo');
    expect(stripped).toContain('Read the official page for hours.');
  });
});

describe('splitSentences', () => {
  test('does not split on a title abbreviation or a middle initial', () => {
    const text =
      "St. Joseph's Park is a small park. Vincent G. Kennelley Park is in Perinton.";
    expect(splitSentences(text)).toEqual([
      "St. Joseph's Park is a small park.",
      'Vincent G. Kennelley Park is in Perinton.',
    ]);
  });

  test('splits after a closing quote', () => {
    const text = 'It was dedicated "to all who served." A gazebo stands there.';
    expect(splitSentences(text)).toEqual([
      'It was dedicated "to all who served."',
      'A gazebo stands there.',
    ]);
  });
});

describe('countSyllables', () => {
  test('counts vowel groups, with a one-syllable floor', () => {
    expect(countSyllables('park')).toBe(1);
    expect(countSyllables('picnic')).toBe(2);
    expect(countSyllables('municipality')).toBe(6);
  });
});

describe('measure', () => {
  // A plain, short-sentence body, comfortably under grade 8 and under 25
  // words a sentence: a passing body.
  const passing =
    'The park has a small pond. Ducks live on the pond. Kids feed the ducks bread. A path goes around the pond. Benches sit along the path. The park is open every day. It has a small parking lot. Bring a leash for your dog. The park also has a picnic table. You can park on the street nearby.';

  // The same idea, said with harder words, but no single sentence over 25
  // words: fails on grade only.
  const failingOnGrade =
    'The municipality maintains a substantial aquatic impoundment frequented by resident waterfowl. Visitors traversing the perimeter footpath commonly provision the anatidae with bread. Municipal advisories discourage this practice due to digestive complications. Additional signage recommends alternative supplementary nutritional offerings for the birds involved. The impoundment also supports numerous amphibious and invertebrate populations.';

  // Plain words, one sentence over 25 words: fails on sentence length only.
  const failingOnSentenceLength =
    'The park has a pond where ducks live and where kids like to feed them bread even though a sign near the gate asks visitors not to do that because bread is bad for ducks. It is a nice place to sit.';

  // Under the 50-word grading floor, but with one over-long sentence: only
  // the sentence-length rule applies.
  const shortWithLongSentence =
    'The park is small and quiet and has a pond where ducks live and a bench where you can sit and watch them all afternoon if you want to.';

  test('a passing body reports no failures', () => {
    const result = evaluate(passing);
    expect(result.passed).toBe(true);
    expect(result.words).toBeGreaterThanOrEqual(50);
  });

  test('a body failing on grade is reported, with its longest sentence', () => {
    const result = evaluate(failingOnGrade);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes('grade'))).toBe(true);
    expect(result.grade).toBeGreaterThan(8);
  });

  test('a body failing on sentence length is reported even if graded fine', () => {
    const result = evaluate(failingOnSentenceLength);
    expect(result.passed).toBe(false);
    expect(result.reasons.some((r) => r.includes('sentence'))).toBe(true);
    expect(result.longestSentence?.words).toBeGreaterThan(25);
  });

  test('a short body is graded on sentence length only, not Flesch-Kincaid', () => {
    const result = evaluate(shortWithLongSentence);
    expect(result.words).toBeLessThan(50);
    expect(result.grade).toBeUndefined();
    expect(result.passed).toBe(false);
    expect(result.reasons).toEqual([
      `a ${result.longestSentence?.words}-word sentence is over 25`,
    ]);
  });

  test('images and captions do not count towards words or grade', () => {
    const bareWords = wordsOnly(passing);
    const withPhotos = [
      '![A pond](pond.jpg)',
      '',
      '*Ducks resting by the water*',
      '',
      passing,
      '',
      '![Another view](view.jpg)',
      '',
      '*A wider shot of the path*',
    ].join('\n');
    expect(measure(withPhotos).words).toBe(bareWords);
    expect(measure(withPhotos).grade).toBeCloseTo(measure(passing).grade!, 5);
  });
});

function wordsOnly(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

describe('fleschKincaidGrade', () => {
  test('is a plain function of sentences', () => {
    const grade = fleschKincaidGrade(['The cat sat on the mat.']);
    expect(typeof grade).toBe('number');
  });
});
