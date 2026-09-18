<script lang="ts">
  import { project, type Marker } from '#lib/municipalities.js';
  import {
    CITY_BOX,
    NEIGHBORHOODS,
    neighborhoodUrl,
  } from '#lib/neighborhoods.js';

  /**
   * The city drawn with its neighborhoods, the way `TownLocator` draws the
   * county with its towns.
   *
   * Given `counts`, the map is a way in: a neighborhood with parks links to
   * its group on the by-neighborhood page, and one with none is drawn paler
   * and links nowhere.
   */
  let {
    markers = [],
    counts,
    label = 'The neighborhoods of the City of Rochester',
  }: {
    markers?: Marker[];
    counts?: Map<string, number>;
    label?: string;
  } = $props();

  /** A dot the same size on every map. See `TownShape`. */
  const DOT = 0.028;

  const dots = $derived(
    markers.map((m) => ({
      title: m.title,
      ...project(m.latitude, m.longitude),
    }))
  );

  const plural = (n: number) => (n === 1 ? '1 park' : `${n} parks`);
</script>

<!-- A map of links is not an image: a screen reader has to reach the links,
     so only the plain map takes `role="img"`. -->
<svg
  class="locator"
  viewBox="{CITY_BOX.x} {CITY_BOX.y} {CITY_BOX.width} {CITY_BOX.height}"
  xmlns="http://www.w3.org/2000/svg"
  role={counts ? undefined : 'img'}
  aria-label={label}
>
  {#each NEIGHBORHOODS as n (n.key)}
    {@const count = counts?.get(n.key) ?? 0}
    {#if count > 0}
      <a href={neighborhoodUrl(n.key)}>
        <title>{n.name}, {plural(count)}</title>
        <path
          class="boundary"
          vector-effect="non-scaling-stroke"
          d={n.paths.join(' ')}
        />
      </a>
    {:else}
      <path
        class="boundary"
        class:empty={counts !== undefined}
        vector-effect="non-scaling-stroke"
        d={n.paths.join(' ')}
      >
        <title>{counts ? `${n.name}, no parks listed` : n.name}</title>
      </path>
    {/if}
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
    stroke-width: var(--stroke-thin);
    stroke-linejoin: round;
  }

  a .boundary {
    cursor: pointer;
  }

  a:is(:hover, :focus-visible) .boundary {
    fill: var(--land-active);
    stroke: var(--ink);
    stroke-width: var(--stroke-bold);
  }

  a:focus-visible {
    outline: none;
  }

  /* No park is listed here, so there is nothing to link to. */
  .boundary.empty {
    fill: var(--paper-sunk);
  }

  /* The park this page is about, in the one accent the site allows. */
  .park {
    fill: var(--orange);
    stroke: var(--ink);
    stroke-width: var(--stroke-base);
  }
</style>
