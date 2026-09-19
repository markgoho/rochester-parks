<script lang="ts">
  import {
    COUNTY_VIEW_BOX,
    MUNICIPALITIES,
    municipality,
    project,
    type Marker,
  } from '#lib/municipalities.js';
  import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';

  /**
   * The map key of the town to pick out, as `townKey` gives it. Left out on a
   * county map, where no single town carries the accent.
   */
  let {
    town,
    markers = [],
    label,
  }: { town?: string; markers?: Marker[]; label?: string } = $props();

  const here = $derived(town ? municipality(town) : undefined);
  const name = $derived(
    label ?? (here ? `${here.name} in Monroe County` : 'Monroe County')
  );

  /** The width of the county map, to keep a dot the size it has on a town. */
  const SPAN = 673;
  /** A dot the same size on every map. See `TownShape`. */
  const DOT = 0.028;

  const dots = $derived(
    markers.map((m) => ({
      title: m.title,
      ...project(m.latitude, m.longitude),
    }))
  );
</script>

<svg
  class="locator"
  viewBox={COUNTY_VIEW_BOX}
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={name}
>
  {#each MUNICIPALITIES as m (m.key)}
    <path
      class="boundary"
      class:on={m.key === town}
      vector-effect="non-scaling-stroke"
      d={m.paths.join(' ')}
    />
  {/each}
  <path
    class="water river"
    vector-effect="non-scaling-stroke"
    d={GENESEE_RIVER}
  />
  <path class="water canal" vector-effect="non-scaling-stroke" d={ERIE_CANAL} />
  {#each dots as dot (dot.title)}
    <circle
      class="park"
      cx={dot.x}
      cy={dot.y}
      r={SPAN * DOT}
      vector-effect="non-scaling-stroke"
    />
  {/each}
</svg>

<style>
  .locator {
    display: block;
    width: 100%;
    height: auto;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--rule-strong);
    stroke-width: var(--stroke-thin);
    stroke-linejoin: round;
  }

  /* The town this page is about, and nothing else, carries the accent. */
  .boundary.on {
    fill: var(--land-active);
    stroke: var(--ink);
    stroke-width: var(--stroke-bold);
  }

  /* The Genesee River and the Erie Canal, beneath the dots. They are a
     picture only, so they never take the pointer from a link. */
  .water {
    fill: none;
    stroke: var(--water);
    stroke-width: var(--stroke-water);
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  /* The river is the wider water. */
  .river {
    stroke-width: var(--stroke-river);
  }

  /* The park this page is about, in the one accent the site allows. */
  .park {
    fill: var(--orange);
    stroke: var(--ink);
    stroke-width: var(--stroke-base);
  }
</style>
