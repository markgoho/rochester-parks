import { outlineBox, project } from './municipalities';
import type { ParkOutline } from './types';

/**
 * A Park's outline in the county map space, one path per polygon. The
 * projection keeps true proportions at this latitude, so a map framed to the
 * outline shows the Park's real shape. A hole stays in its polygon's path,
 * so the path must fill with `evenodd`.
 *
 * Three decimals, because one map unit is about 76 m and a small Park is
 * only a few units across.
 */
export function outlinePaths(outline: ParkOutline): string[] {
  return outline.polygons.map((polygon) =>
    polygon
      .map((ring) => {
        const points = ring.slice(0, -1).map(([longitude, latitude]) => {
          const { x, y } = project(latitude, longitude);
          return `${x.toFixed(3)} ${y.toFixed(3)}`;
        });
        return `M${points.join('L')}Z`;
      })
      .join('')
  );
}

/**
 * About how many metres one county map unit spans at Monroe County's
 * latitude, the same across and up and down. See `project`.
 */
const METRES_PER_UNIT = 76;

/**
 * A map framed to the Park itself: a view box around its outline, padded so
 * the stroke is not cut, and its widest side in metres, to the nearest 10,
 * for a caption that gives the reader the scale.
 */
export function parkFrame(paths: string[]): {
  viewBox: string;
  metres: number;
} {
  const tight = outlineBox({ key: '', name: '', paths }, 0);
  const span = Math.max(tight.width, tight.height);
  const { x, y, width, height } = outlineBox(
    { key: '', name: '', paths },
    span * 0.04
  );
  return {
    viewBox: [x, y, width, height].map((n) => Number(n.toFixed(3))).join(' '),
    metres: Math.round((span * METRES_PER_UNIT) / 10) * 10,
  };
}
