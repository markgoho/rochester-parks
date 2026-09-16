<script lang="ts">
  import {
    COUNTY_VIEW_BOX,
    MUNICIPALITIES,
    type Municipality,
  } from '$lib/municipalities';

  /**
   * The map is drawn twice.
   *
   * SVG paints in document order and has no z-index, so a town picked out in
   * place would go behind each town later in the list. The resting layer draws
   * the whole county and takes no clicks. The raised layer holds the links,
   * comes last, and so can lift one town clear of all of them.
   */
  const towns = MUNICIPALITIES.filter((m) => m.href !== undefined);

  /** A town and the villages inside it move as one piece. */
  const villagesIn = (key: string) =>
    MUNICIPALITIES.filter((m) => m.within === key);

  /**
   * A picked town is drawn larger and a little offset, so its resting copy
   * would show from under it: the old name pokes out beside the new one.
   * These rules take the resting copy away while the raised one is up. They
   * name each town, so they cannot be written by hand in a scoped block.
   */
  const swap = MUNICIPALITIES.filter((m) => m.href)
    .map(
      (m) =>
        `.county-map:has([data-pick="${m.key}"]:is(:hover,:focus-visible))` +
        ` [data-rest="${m.key}"]{visibility:hidden}`
    )
    .join('');
</script>

<svelte:head>
  {@html `<style>${swap}</style>`}
</svelte:head>

{#snippet shape(m: Municipality, rest?: string)}
  <g
    class="municipality"
    class:village={m.within !== undefined || !m.href}
    data-rest={rest}
  >
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
  <g class="resting" aria-hidden="true">
    {#each MUNICIPALITIES as m (m.key)}
      {@render shape(m, m.within ?? (m.href ? m.key : undefined))}
    {/each}
  </g>

  <g class="raised">
    {#each towns as town (town.key)}
      <a class="pick" href={town.href} data-pick={town.key}>
        <title>{town.name}</title>
        {@render shape(town)}
        {#each villagesIn(town.key) as village (village.key)}
          {@render shape(village)}
        {/each}
      </a>
    {/each}
  </g>
</svg>

<style>
  .county-map {
    display: block;
    width: 100%;
    height: auto;
  }

  /* The county at rest. It is a picture, not a control. */
  .resting {
    pointer-events: none;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--ink);
    stroke-width: 0.9px;
    stroke-linejoin: round;
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

  /* The village outline carries the whole shape at rest, because its fill sits
     very close to the land. It needs an ink dark enough to read against both. */
  .village .boundary {
    fill: var(--paper-sunk);
    stroke: var(--ink-muted);
  }

  /* A village label lands on the town beneath it, so it crosses two very
     different backgrounds: the land at rest, the active fill on hover. A paper
     halo gives the ink a constant background on both. Weight, not color,
     keeps the village quieter than the town. */
  .village .boundary-text {
    fill: var(--ink-soft);
    font-weight: 400;
    paint-order: stroke fill;
    stroke: var(--paper);
    stroke-width: 2px;
    stroke-linejoin: round;
  }

  /*
   * Each town is a hit area over the resting map, invisible until it is
   * picked. Nothing here is a second copy for a reader: the resting layer is
   * hidden from assistive software, and these carry the names and the links.
   */
  .pick {
    opacity: 0;
    /* The whole town lifts about its own middle, villages and names with it. */
    transform-box: fill-box;
    transform-origin: center;
    scale: 1;
    /* Only the lift is animated. The copy itself appears at the moment the
       resting one goes, at the same size, so the swap cannot be seen. */
    transition: scale 160ms ease-out;
  }

  .pick:hover,
  .pick:focus-visible {
    opacity: 1;
  }

  .pick:focus-visible {
    outline: none;
  }

  .pick:hover .boundary,
  .pick:focus-visible .boundary {
    fill: var(--land-active);
    stroke-width: 1.6px;
  }

  /*
   * A small town carries its name outside its own border, so the paper ink
   * cannot count on the active fill behind it. A halo in the active colour
   * gives the name the same background wherever it falls.
   */
  .pick:hover .boundary-text,
  .pick:focus-visible .boundary-text {
    fill: var(--paper);
    paint-order: stroke fill;
    stroke: var(--land-active);
    stroke-width: 3px;
    stroke-linejoin: round;
  }

  /* A village keeps its own colours while it rides up with its town. */
  .pick:hover .village .boundary,
  .pick:focus-visible .village .boundary {
    fill: var(--paper-sunk);
    stroke: var(--ink);
  }

  .pick:hover .village .boundary-text,
  .pick:focus-visible .village .boundary-text {
    fill: var(--ink);
    stroke: var(--paper);
    stroke-width: 2px;
  }

  /* The lift itself, only where a real pointer can hover. A touch reader gets
     the colour, and no part of the map moves under their finger. */
  @media (hover: hover) and (pointer: fine) {
    .pick:hover,
    .pick:focus-visible {
      scale: 1.18;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pick {
      transition: none;
    }
  }
</style>
