<script module lang="ts">
  /** The ids a `TownShape` with `shared` points its `<use>`s at. */
  export const RIVER_ID = 'map-genesee-river';
  export const CANAL_ID = 'map-erie-canal';
  export const shapeId = (key: string) => `map-shape-${key}`;
  export const clipId = (key: string) => `map-clip-${key}`;
</script>

<script lang="ts">
  import { runsThrough, type Outline } from '#lib/municipalities.js';
  import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';

  /** Each place a map on the page draws, once, by key. */
  let { shapes }: { shapes: Outline[] } = $props();

  /** The water goes in only when some map on the page draws it. */
  const river = $derived(shapes.some((s) => runsThrough(s, GENESEE_RIVER)));
  const canal = $derived(shapes.some((s) => runsThrough(s, ERIE_CANAL)));
</script>

<!-- What the maps of a page with many maps share, once for the whole page:
     each place's outline and the clip cut to it, and the river and the canal.
     On the city cards, 76 maps drew 34 Neighborhoods, each outline twice, and
     the river 42 times. Render this once on a page, never once per list: the
     ids must be unique.

     The box is zero in size, not hidden, so no browser drops what it holds.
     `vector-effect` does not inherit, so it goes on the paths themselves. A
     clip path can hold only shapes, so each place has a clip of its own
     beside the group a map draws. -->
<svg class="map-defs" width="0" height="0" aria-hidden="true">
  <defs>
    {#each shapes as shape (shape.key)}
      <clipPath id={clipId(shape.key)}>
        {#each shape.paths as d (d)}
          <path {d} />
        {/each}
      </clipPath>
      <g id={shapeId(shape.key)}>
        {#each shape.paths as d (d)}
          <path vector-effect="non-scaling-stroke" {d} />
        {/each}
      </g>
    {/each}
    {#if river}
      <path
        id={RIVER_ID}
        vector-effect="non-scaling-stroke"
        d={GENESEE_RIVER}
      />
    {/if}
    {#if canal}
      <path id={CANAL_ID} vector-effect="non-scaling-stroke" d={ERIE_CANAL} />
    {/if}
  </defs>
</svg>

<style>
  .map-defs {
    position: absolute;
  }
</style>
