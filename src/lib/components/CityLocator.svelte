<script lang="ts">
  import { project, type Marker } from '$lib/municipalities';
  import { CITY_BOX, NEIGHBORHOODS } from '$lib/neighborhoods';

  /**
   * The city drawn with its neighborhoods, the way `TownLocator` draws the
   * county with its towns. A neighborhood has no page, so none is a link.
   */
  let {
    markers = [],
    label = 'The neighborhoods of the City of Rochester',
  }: { markers?: Marker[]; label?: string } = $props();

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
  viewBox="{CITY_BOX.x} {CITY_BOX.y} {CITY_BOX.width} {CITY_BOX.height}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={label}
>
  {#each NEIGHBORHOODS as n (n.key)}
    <path
      class="boundary"
      vector-effect="non-scaling-stroke"
      d={n.paths.join(' ')}
    >
      <title>{n.name}</title>
    </path>
  {/each}
  {#each dots as dot (dot.title)}
    <circle
      class="park"
      cx={dot.x}
      cy={dot.y}
      r={Math.max(CITY_BOX.width, CITY_BOX.height) * DOT}
      vector-effect="non-scaling-stroke"
    />
  {/each}
</svg>

<style>
  .locator {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--rule-strong);
    stroke-width: 0.8px;
    stroke-linejoin: round;
  }

  .boundary:hover {
    fill: var(--land-active);
  }

  /* The park this page is about, in the one accent the site allows. */
  .park {
    fill: var(--orange);
    stroke: var(--ink);
    stroke-width: 1.2px;
  }
</style>
