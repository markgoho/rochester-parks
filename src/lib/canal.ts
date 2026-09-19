import { ERIE_CANAL } from './erie-canal.js';

type Box = { x: number; y: number; width: number; height: number };

const points = [...ERIE_CANAL.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(
  ([, x, y]) => [Number(x), Number(y)] as const
);

/**
 * The stretch of the canal inside a box, cut at its sides.
 *
 * A clip path hides the canal outside a shape, but the whole canal still
 * counts in the bounding box of the group that holds it. On the county map a
 * raised town grows about the middle of that box, so a canal running the
 * width of the county pulled the middle off the town and the town slid as it
 * grew. Cut to the town's own box, the canal adds nothing to it.
 *
 * Each segment is cut by Liang–Barsky. Returns an empty string when the canal
 * misses the box.
 */
export function canalIn(box: Box): string {
  const left = box.x;
  const right = box.x + box.width;
  const top = box.y;
  const bottom = box.y + box.height;
  const round = (n: number) => Number(n.toFixed(2));
  let d = '';
  let open = false;

  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const dx = bx - ax;
    const dy = by - ay;
    let t0 = 0;
    let t1 = 1;
    const edges: [number, number][] = [
      [-dx, ax - left],
      [dx, right - ax],
      [-dy, ay - top],
      [dy, bottom - ay],
    ];
    let inside = true;
    for (const [p, q] of edges) {
      if (p === 0) {
        if (q < 0) inside = false;
        continue;
      }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
    if (!inside || t0 > t1) {
      open = false;
      continue;
    }
    const at = (t: number) => `${round(ax + t * dx)} ${round(ay + t * dy)}`;
    if (!open || t0 > 0) d += `M${at(t0)}`;
    d += `L${at(t1)}`;
    open = t1 === 1;
  }
  return d;
}
