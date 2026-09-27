<script lang="ts">
  import { parkFrame } from '#lib/park-shapes.js';

  /**
   * The Park's own land, framed to its outline, north up. The town map beside
   * the facts says where the Park is; this says what shape it is.
   */
  let {
    paths,
    label,
    square = false,
  }: {
    /** The outline in the county map space. See `outlinePaths`. */
    paths: string[];
    label: string;
    /**
     * Frame the outline in a square with no caption: a tile for a card, the
     * same room for every Park, where the card gives the size in acres.
     */
    square?: boolean;
  } = $props();

  const frame = $derived(parkFrame(paths, { square }));
</script>

{#snippet map(className: string)}
  <svg
    class={className}
    viewBox={frame.viewBox}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={label}
  >
    {#each paths as d (d)}
      <path class="land" vector-effect="non-scaling-stroke" {d} />
    {/each}
  </svg>
{/snippet}

{#if square}
  {@render map('park-shape park-shape--square')}
{:else}
  <figure class="park-shape">
    {@render map('park-shape__map')}
    <figcaption class="mono">
      About {frame.metres.toLocaleString('en-US')} m across
    </figcaption>
  </figure>
{/if}

<style>
  .park-shape {
    display: grid;
    gap: var(--space-8);
    margin: 0;
  }

  svg {
    display: block;
    overflow: visible;
  }

  .park-shape__map {
    width: 100%;
    height: auto;
    /* A tall, thin Park would otherwise run down the whole rail. */
    max-block-size: 16rem;
  }

  /* The card sizes the tile. A square view box keeps it square. */
  .park-shape--square {
    aspect-ratio: 1;
  }

  /* The Park's land, in green. A hole in the outline, such as a private lot
     inside the Park, stays open. */
  .land {
    fill: var(--park);
    fill-rule: evenodd;
    stroke: var(--ink-soft);
    stroke-width: var(--stroke-base);
    stroke-linejoin: round;
  }

  figcaption {
    color: var(--ink-soft);
    font-size: var(--step--1);
  }
</style>
