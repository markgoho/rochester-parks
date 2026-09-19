<script module lang="ts">
  /** The ids a `TownShape` with `sharedWater` points its `<use>` at. */
  export const RIVER_ID = 'water-genesee-river';
  export const CANAL_ID = 'water-erie-canal';
</script>

<script lang="ts">
  import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';
</script>

<!-- The river and the canal, once for the whole page. A page with a map in
     each of many cards draws its water here and points each map at it; the
     river alone is some 3 KB, and the city cards drew it 43 times. Render
     this once on a page, never once per list: the ids must be unique.

     The box is zero in size, not hidden, so no browser drops what it holds.
     `vector-effect` does not inherit, so it goes on the paths themselves. -->
<svg class="water-defs" width="0" height="0" aria-hidden="true">
  <defs>
    <path id={RIVER_ID} vector-effect="non-scaling-stroke" d={GENESEE_RIVER} />
    <path id={CANAL_ID} vector-effect="non-scaling-stroke" d={ERIE_CANAL} />
  </defs>
</svg>

<style>
  .water-defs {
    position: absolute;
  }
</style>
