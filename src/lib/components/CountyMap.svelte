<script lang="ts">
  import {
    COUNTY_VIEW_BOX,
    MUNICIPALITIES,
    type Municipality,
  } from '$lib/municipalities';
</script>

{#snippet shape(m: Municipality)}
  <g class="{m.key} municipality" class:linked={m.href !== undefined}>
    <title>{m.name}</title>
    {#each m.paths as d (d)}
      <path class="boundary" {d} />
    {/each}
    <text class="boundary-text" x={m.label.x} y={m.label.y}>{m.label.text}</text
    >
  </g>
{/snippet}

<svg
  class="county-map"
  width="673"
  height="633"
  viewBox={COUNTY_VIEW_BOX}
  xmlns="http://www.w3.org/2000/svg"
>
  {#each MUNICIPALITIES as m (m.key)}
    {#if m.href}
      <a href={m.href}>{@render shape(m)}</a>
    {:else}
      {@render shape(m)}
    {/if}
  {/each}
</svg>

<style>
  .county-map {
    display: block;
    width: 100%;
    height: auto;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--ink);
    stroke-width: 0.9px;
    stroke-linejoin: round;
    transition: fill 160ms ease-out;
  }

  .boundary-text {
    fill: var(--ink);
    font-family: var(--mono);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    pointer-events: none;
  }

  /* Villages with no section of their own sit quiet, and let clicks pass
     through to the town beneath them. */
  .municipality:not(.linked) {
    pointer-events: none;
  }

  /* The village outline carries the whole shape at rest, because its fill sits
     very close to the land. It needs an ink dark enough to read against both. */
  .municipality:not(.linked) .boundary {
    fill: var(--paper-sunk);
    stroke: var(--ink-muted);
  }

  /* A village label lands on the town beneath it, so it crosses two very
     different backgrounds: the land at rest, the active fill on hover. A paper
     halo gives the ink a constant background on both. Weight, not color,
     keeps the village quieter than the town. */
  .municipality:not(.linked) .boundary-text {
    fill: var(--ink-soft);
    font-weight: 400;
    paint-order: stroke fill;
    stroke: var(--paper);
    stroke-width: 2px;
    stroke-linejoin: round;
  }

  a:hover .boundary,
  a:focus-visible .boundary {
    fill: var(--land-active);
  }

  a:hover .boundary-text,
  a:focus-visible .boundary-text {
    fill: var(--paper);
  }

  a:focus-visible {
    outline: none;
  }

  a:focus-visible .boundary {
    stroke-width: 2.4px;
  }
</style>
