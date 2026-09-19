import { iconSprite } from '#lib/icons.js';

export const prerender = true;

export function GET() {
  return new Response(iconSprite(), {
    headers: { 'Content-Type': 'image/svg+xml' },
  });
}
