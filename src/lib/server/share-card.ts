import { Resvg } from '@resvg/resvg-js';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import opentype from 'opentype.js';
import wawoff2 from 'wawoff2';
import { parkFrame } from '../park-shapes.js';

/**
 * The share image (`og:image`, #369): a 1200x630 PNG. Social platforms
 * reject SVG, so the card is drawn as SVG and rasterised here, at build time,
 * from the site's own two fonts. A park or trail page with no photo gets its
 * outline, name and label; every other page gets the site card.
 */

const WIDTH = 1200;
const HEIGHT = 630;

// The colour tokens in app.css, as hex. An SVG file cannot read a CSS token.
const PAPER = '#f1eee4';
const INK = '#14291e';
const INK_SOFT = '#303f35';
const ORANGE = '#d6501e';
const PARK = '#7aaa77';
const RULE = '#cfc7b3';

/** The site's woff2 files as TTF, which is what resvg and opentype read. */
async function loadFont(name: string): Promise<Uint8Array> {
  const woff2 = readFileSync(join(process.cwd(), 'src/lib/fonts', name));
  return Uint8Array.from(await wawoff2.decompress(woff2));
}

// One after the other: wawoff2 shares one WASM heap between calls.
const display = await loadFont('ArchivoBlack-400.woff2');
// Public Sans is a variable font whose default instance is Thin, and resvg
// cannot pick another, so small text is set in the site's mono (Space Mono,
// which the eyebrow labels use) instead.
const mono = await loadFont('SpaceMono-400.woff2');
const monoBold = await loadFont('SpaceMono-700.woff2');
const displayFont = opentype.parse(display.buffer as ArrayBuffer);

/**
 * Curly quotes, as the site's smartypants sets them in page text: an
 * apostrophe or closing quote after a letter, number or punctuation, an
 * opening quote anywhere else.
 */
export const curly = (value: string) =>
  value
    .replace(/(^|[\s(\[\u2014-])'/g, '$1\u2018')
    .replace(/'/g, '\u2019')
    .replace(/(^|[\s(\[\u2014-])"/g, '$1\u201c')
    .replace(/"/g, '\u201d');

const escapeXml = (value: string) =>
  value.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/** Greedy line breaks by real glyph widths. Undefined if it will not fit. */
function wrap(
  name: string,
  size: number,
  maxWidth: number,
  maxLines: number
): string[] | undefined {
  const lines: string[] = [];
  let line = '';
  for (const word of name.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (displayFont.getAdvanceWidth(next, size) <= maxWidth) {
      line = next;
    } else if (!line) {
      return undefined; // one word wider than the box: never break mid-word
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length <= maxLines ? lines : undefined;
}

const MAX_NAME_HEIGHT = 320;

/** The largest size, from 96 down, at which the name fits the box. */
function fitName(name: string, maxWidth: number, maxLines: number) {
  for (let size = 96; size >= 36; size -= 4) {
    const lines = wrap(name, size, maxWidth, maxLines);
    // The block must also leave room for the section line above the footer.
    if (lines && lines.length * Math.round(size * 1.08) <= MAX_NAME_HEIGHT) {
      return { size, lines };
    }
  }
  return { size: 36, lines: wrap(name, 36, maxWidth, 8) ?? [name] };
}

const mark = (x: number, y: number, size: number) => `
  <g transform="translate(${x} ${y}) scale(${size / 24})" fill="none"
     stroke="${ORANGE}" stroke-width="1.8" stroke-linejoin="round">
    <path d="M12 3 21 19H3L12 3Z"/><path d="M12 11v8" stroke-linecap="round"/>
  </g>`;

const frameSvg = (body: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
     viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${PAPER}"/>
  <rect width="${WIDTH}" height="14" fill="${ORANGE}"/>
  ${body}
</svg>`;

/** The outline, fitted and centred in a box, north up. */
function shape(
  paths: string[],
  box: { x: number; y: number; w: number; h: number }
) {
  const [vx, vy, vw, vh] = parkFrame(paths).viewBox.split(' ').map(Number);
  const scale = Math.min(box.w / vw, box.h / vh);
  const tx = box.x + (box.w - vw * scale) / 2 - vx * scale;
  const ty = box.y + (box.h - vh * scale) / 2 - vy * scale;
  return `<g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})"
      fill="${PARK}" fill-rule="evenodd" stroke="${INK_SOFT}"
      stroke-width="${(4 / scale).toFixed(4)}" stroke-linejoin="round">
    ${paths.map((d) => `<path d="${d}"/>`).join('')}
  </g>`;
}

const text = (
  content: string,
  x: number,
  y: number,
  size: number,
  {
    family,
    fill,
    weight = 400,
    spacing = 0,
  }: { family: string; fill: string; weight?: number; spacing?: number }
) =>
  `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}"
    font-weight="${weight}" letter-spacing="${spacing}" fill="${fill}">${escapeXml(content)}</text>`;

const DISPLAY = { family: 'Archivo Black', fill: INK };
const SANS = { family: 'Space Mono', fill: INK_SOFT };

const footer = () =>
  `<rect x="72" y="556" width="1056" height="2" fill="${RULE}"/>${text(
    'rochesterparks.org',
    72,
    598,
    26,
    SANS
  )}`;

// resvg takes the fonts from files; its in-memory option did not match the
// family names here.
const fontDir = mkdtempSync(join(tmpdir(), 'share-card-fonts-'));
const fontFiles = [display, mono, monoBold].map((font, i) => {
  const file = join(fontDir, `${i}.ttf`);
  writeFileSync(file, font);
  return file;
});

function render(svg: string): Uint8Array {
  return new Resvg(svg, {
    font: {
      fontFiles,
      loadSystemFonts: false,
      defaultFontFamily: 'Space Mono',
    },
  })
    .render()
    .asPng();
}

/** One park: shape on the right, name and section on the left. */
export function parkCard({
  name,
  section,
  paths,
}: {
  name: string;
  section: string;
  paths?: string[];
}): Uint8Array {
  name = curly(name);
  section = curly(section);
  const { size, lines } = fitName(name, paths ? 560 : 1056, 4);
  const lineHeight = Math.round(size * 1.08);
  const block = lines.length * lineHeight;
  // The name and section sit as one block, centred between the brand row and
  // the footer rule.
  const top = 110 + (410 - block - 50) / 2 + size * 0.85;
  const body = [
    mark(72, 50, 44),
    text('ROCHESTER PARKS', 128, 82, 26, {
      ...SANS,
      fill: INK,
      weight: 700,
      spacing: 3,
    }),
    lines
      .map((l, i) => text(l, 72, top + i * lineHeight, size, DISPLAY))
      .join(''),
    text(section.toUpperCase(), 72, top + block + 12, 30, {
      ...SANS,
      weight: 700,
      spacing: 4,
    }),
    footer(),
    paths ? shape(paths, { x: 680, y: 110, w: 448, h: 420 }) : '',
  ].join('');
  return render(frameSvg(body));
}

/** The card for every page that is not a park without a photo. */
export function siteCard(): Uint8Array {
  const body = [
    mark(72, 96, 96),
    text('Rochester Parks', 72, 330, 112, DISPLAY),
    text('Every park in Monroe County, New York', 72, 410, 44, SANS),
    footer(),
  ].join('');
  return render(frameSvg(body));
}
