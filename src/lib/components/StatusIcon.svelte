<script module lang="ts">
  export type { IconKind, StatusKind } from '#lib/icons.js';
</script>

<script lang="ts">
  import { iconHref, type IconKind } from '#lib/icons.js';

  let { kind, size = 16 }: { kind: IconKind; size?: number } = $props();
</script>

<!-- The icon's path is in the sprite file, not in the page. See `iconSprite`.
     `currentColor` passes on to the path through the `<use>`. -->
<svg width={size} height={size} fill="currentColor" aria-hidden="true">
  <use href={iconHref(kind)} />
</svg>
