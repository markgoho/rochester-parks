<script lang="ts">
  import { parkFrame } from '#lib/park-shapes.js';

  /**
   * The Park's own land, framed to its outline, north up. The town map beside
   * the facts says where the Park is; this says what shape it is.
   */
  let {
    paths,
    label,
  }: {
    /** The outline in the county map space. See `outlinePaths`. */
    paths: string[];
    label: string;
  } = $props();

  const frame = $derived(parkFrame(paths));
</script>

<figure class="park-shape">
  <svg
    viewBox={frame.viewBox}
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={label}
  >
    {#each paths as d (d)}
      <path class="land" vector-effect="non-scaling-stroke" {d} />
    {/each}
  </svg>
  <figcaption class="mono">
    About {frame.metres.toLocaleString('en-US')} m across
  </figcaption>
</figure>

<style>
  .park-shape {
    display: grid;
    gap: var(--space-8);
    margin: 0;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    /* A tall, thin Park would otherwise run down the whole rail. */
    max-block-size: 16rem;
    overflow: visible;
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
