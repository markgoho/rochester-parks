<script lang="ts">
  import {
    COUNTY_VIEW_BOX,
    MUNICIPALITIES,
    municipality,
  } from '$lib/municipalities';

  /** The map key of the town to pick out, as `townKey` gives it. */
  let { town }: { town: string } = $props();

  const here = $derived(municipality(town));
</script>

{#if here}
  <svg
    class="locator"
    viewBox={COUNTY_VIEW_BOX}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="{here.name} in Monroe County"
  >
    {#each MUNICIPALITIES as m (m.key)}
      <path
        class="boundary"
        class:on={m.key === town}
        vector-effect="non-scaling-stroke"
        d={m.paths.join(' ')}
      />
    {/each}
  </svg>
{/if}

<style>
  .locator {
    display: block;
    width: 100%;
    height: auto;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--rule-strong);
    stroke-width: 0.8px;
    stroke-linejoin: round;
  }

  /* The town this page is about, and nothing else, carries the accent. */
  .boundary.on {
    fill: var(--land-active);
    stroke: var(--ink);
    stroke-width: 1.4px;
  }
</style>
