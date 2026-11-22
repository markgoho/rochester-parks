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
 * from the site's own two fonts. A park or trail with a photo gets the photo
 * under a dark gradient with its name and label; one without gets its outline
 * on paper. A section list gets a title card; every other page gets the site
 * card.
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

/**
 * One park: with a photo, the photo card; without, the shape on the right,
 * name and section on the left.
 */
export function parkCard({
  name,
  section,
  paths,
  photo,
}: {
  name: string;
  section: string;
  paths?: string[];
  /** A site-relative path under `static/`. */
  photo?: string;
}): Uint8Array {
  name = curly(name);
  section = curly(section);
  const uri = photoDataUri(photo);
  if (uri) return photoCard(name, section, uri);
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

/**
 * The photo is cover-cropped by resvg. Only the formats it decodes, and only a
 * file on disk: an http URL or an unreadable file gives no photo, and the
 * caller falls back to the paper card.
 */
function photoDataUri(photo: string | undefined): string | undefined {
  if (!photo || /^https?:\/\//.test(photo)) return undefined;
  try {
    const file = join(process.cwd(), 'static', decodeURI(photo));
    const bytes = readFileSync(file);
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;
    const isPng = bytes.subarray(1, 4).toString('latin1') === 'PNG';
    const isWebp = bytes.subarray(8, 12).toString('latin1') === 'WEBP';
    const type = isJpeg ? 'jpeg' : isPng ? 'png' : isWebp ? 'webp' : undefined;
    return type
      ? `data:image/${type};base64,${bytes.toString('base64')}`
      : undefined;
  } catch {
    return undefined;
  }
}

const WHITE = '#ffffff';

/** A park or trail with a photo: the photo, a dark gradient, then the text. */
function photoCard(name: string, section: string, uri: string): Uint8Array {
  const { size, lines } = fitName(name, 1056, 3);
  const lineHeight = Math.round(size * 1.08);
  const last = 482;
  const first = last - (lines.length - 1) * lineHeight;
  const body = `
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0b1610" stop-opacity="0.62"/>
      <stop offset="0.2" stop-color="#0b1610" stop-opacity="0.25"/>
      <stop offset="0.4" stop-color="#0b1610" stop-opacity="0.5"/>
      <stop offset="0.62" stop-color="#0b1610" stop-opacity="0.82"/>
      <stop offset="1" stop-color="#0b1610" stop-opacity="0.94"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#0b1610" stop-opacity="0.35"/>
      <stop offset="0.7" stop-color="#0b1610" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="frame"><rect width="${WIDTH}" height="${HEIGHT}"/></clipPath>
  </defs>
  <g clip-path="url(#frame)">
    <image href="${uri}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}"
           preserveAspectRatio="xMidYMid slice"/>
  </g>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#side)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#shade)"/>
  <rect width="${WIDTH}" height="14" fill="${ORANGE}"/>
  ${mark(72, 50, 44)}
  ${text('ROCHESTER PARKS', 128, 82, 26, { family: 'Space Mono', fill: WHITE, weight: 700, spacing: 3 })}
  ${lines.map((l, i) => text(l, 72, first + i * lineHeight, size, { family: 'Archivo Black', fill: WHITE })).join('')}
  ${text(section.toUpperCase(), 72, last + 46, 30, { family: 'Space Mono', fill: WHITE, weight: 700, spacing: 4 })}
  <rect x="72" y="556" width="1056" height="2" fill="#ffffff" fill-opacity="0.45"/>
  ${text('rochesterparks.org', 72, 598, 26, { family: 'Space Mono', fill: WHITE })}`;
  return render(`
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}"
     viewBox="0 0 ${WIDTH} ${HEIGHT}">${body}</svg>`);
}

/**
 * A title and a line under it, on the mark: the card for a section list, and,
 * with the site's own name, for every other page.
 */
export function titleCard(title: string, subtitle: string): Uint8Array {
  title = curly(title);
  // One line at the largest size that fits, else two lines.
  let size = 112;
  let lines = wrap(title, size, 1056, 1);
  while (!lines && size > 64) {
    size -= 4;
    lines = wrap(title, size, 1056, 1);
  }
  if (!lines) ({ size, lines } = fitName(title, 1056, 2));
  const lineHeight = Math.round(size * 1.08);
  const body = [
    mark(72, 96, 96),
    lines
      .map((l, i) => text(l, 72, 330 + i * lineHeight, size, DISPLAY))
      .join(''),
    text(subtitle, 72, 330 + (lines.length - 1) * lineHeight + 80, 44, SANS),
    footer(),
  ].join('');
  return render(frameSvg(body));
}

/** The card for every page that has no card of its own. */
export function siteCard(): Uint8Array {
  return titleCard('Rochester Parks', 'Every park in Monroe County, New York');
}
