<script lang="ts">
  import {
    COUNTY_VIEW_BOX,
    MUNICIPALITIES,
    outlineBox,
    type Municipality,
  } from '#lib/municipalities.js';
  import { waterIn } from '#lib/water.js';
  import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';

  /**
   * Where a town's link can be picked from. By default only the map's own
   * links pick a town. A wider box around the map and a list of town names
   * lets each name in the list pick its town as well, because both links
   * carry the same href.
   */
  let { scope = '.county-map' }: { scope?: string } = $props();

  /**
   * The map is drawn twice.
   *
   * SVG paints in document order and has no z-index, so a town picked out in
   * place would go behind each town later in the list: Sweden is second of
   * twenty-eight, and nearly every neighbour covers it. The resting layer
   * draws the county and carries the links. The raised layer comes last and
   * holds one enlarged copy of each town, invisible until its link is picked,
   * so a picked town can sit clear of all of them.
   *
   * The links stay in the resting layer on purpose. A raised copy grows about
   * the middle of its own box, and for Brighton and East Rochester that middle
   * falls outside the town, because the name sits beyond the border. Were the
   * enlarged copy the thing being hovered, it could move out from under the
   * pointer and drop, pick, drop. An unmoving hit area cannot.
   */
  const towns = MUNICIPALITIES.filter((m) => m.href !== undefined);

  /**
   * Each town and village carries its own stretch of the river and the canal,
   * cut to its border. The water then hides with a resting town and grows
   * with a raised one, and never floats over the gap a lifted town leaves.
   * Each stretch is cut to the shape's own box first. See `waterIn`.
   *
   * Where the river is the town line, each town carries its own bank's half
   * of it, and the boundary stroke stays: the line runs down the water.
   */
  const uid = $props.id();
  const clipOf = (key: string) => `water-${uid}-${key}`;
  const waterOf = new Map(
    MUNICIPALITIES.map((m) => {
      const box = outlineBox(m, 0);
      return [
        m.key,
        { river: waterIn(GENESEE_RIVER, box), canal: waterIn(ERIE_CANAL, box) },
      ];
    })
  );

  /** A town and the villages inside it move as one piece. */
  const villagesIn = (key: string) =>
    MUNICIPALITIES.filter((m) => m.within === key);

  /**
   * One town's link raises one town's copy, and takes the resting copy out of
   * sight so the old name does not show from under the new one. The resting
   * copy keeps its size and stays where the pointer can reach it.
   *
   * These rules name each town, so they cannot be written by hand in a scoped
   * block. Without `:has()` a reader simply never sees a town lift.
   */
  const lift = $derived(
    towns
      .map((m) => {
        const on = `${scope}:has(a[href="${m.href}"]:is(:hover,:focus-visible))`;
        return (
          `${on} [data-rest="${m.key}"]{opacity:0}` +
          `${on} [data-pick="${m.key}"]{opacity:1}` +
          `@media (hover:hover) and (pointer:fine){` +
          `${on} [data-pick="${m.key}"]{scale:var(--lift-scale)}}`
        );
      })
      .join('')
  );
</script>

<svelte:head>
  {@html `<style>${lift}</style>`}
</svelte:head>

{#snippet shape(m: Municipality)}
  {@const water = waterOf.get(m.key)}
  <g class="municipality" class:village={m.within !== undefined || !m.href}>
    {#each m.paths as d (d)}
      <path class="boundary" {d} />
    {/each}
    {#if water?.river}
      <path
        class="water river"
        clip-path="url(#{clipOf(m.key)})"
        d={water.river}
      />
    {/if}
    {#if water?.canal}
      <path
        class="water canal"
        clip-path="url(#{clipOf(m.key)})"
        d={water.canal}
      />
    {/if}
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
  <defs>
    {#each MUNICIPALITIES as m (m.key)}
      <clipPath id={clipOf(m.key)}>
        {#each m.paths as d (d)}
          <path {d} />
        {/each}
      </clipPath>
    {/each}
  </defs>

  <g class="resting">
    {#each MUNICIPALITIES as m (m.key)}
      {@const rest = m.within ?? (m.href ? m.key : undefined)}
      {#if m.href}
        <a href={m.href} data-rest={rest}>
          <title>{m.name}</title>
          {@render shape(m)}
        </a>
      {:else}
        <g data-rest={rest}>{@render shape(m)}</g>
      {/if}
    {/each}
  </g>

  <!-- Picked out, and larger. A picture only: the links are in the layer
       beneath, and nothing here takes a pointer. -->
  <g class="raised" aria-hidden="true">
    {#each towns as town (town.key)}
      <g class="pick" data-pick={town.key}>
        {@render shape(town)}
        {#each villagesIn(town.key) as village (village.key)}
          {@render shape(village)}
        {/each}
      </g>
    {/each}
  </g>
</svg>

<style>
  .county-map {
    display: block;
    width: 100%;
    height: auto;
    /* A town on the county's own edge grows past the edge of the map. The
       browser clips an outer svg to its viewport, which cut those towns in
       half; the room to grow into is the gap beside the map. */
    overflow: visible;
  }

  .boundary {
    fill: var(--land);
    stroke: var(--ink);
    stroke-width: var(--stroke-thin);
    stroke-linejoin: round;
  }

  .boundary-text {
    fill: var(--ink);
    font-family: var(--mono);
    font-size: var(--text-map);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-snug);
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
     different backgrounds: the land at rest, the active fill when the town is
     picked. A paper halo gives the ink a constant background on both. Weight,
     not colour, keeps the village quieter than the town. */
  .village .boundary-text {
    fill: var(--ink-soft);
    font-weight: var(--weight-regular);
    paint-order: stroke fill;
    stroke: var(--paper);
    stroke-width: var(--stroke-halo);
    stroke-linejoin: round;
  }

  /* A village has no section of its own, so it lets the pointer through to
     the town it stands in. */
  .village {
    pointer-events: none;
  }

  /* The Genesee River and the Erie Canal. They are a picture only, so they
     never take the pointer from a town's link. */
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

  .resting a:focus-visible {
    outline: none;
  }

  /*
   * The raised copies. Each is invisible until its town is picked, so it can
   * carry the picked colours at all times and the rules that name each town
   * stay down to opacity and size.
   */
  .raised {
    pointer-events: none;
  }

  .pick {
    opacity: 0;
    /* The whole town grows about its own middle, villages and names with it. */
    transform-box: fill-box;
    transform-origin: center;
    scale: 1;
    /* Only the growth is animated. The copy itself appears at the moment the
       resting one goes, at the same size, so the swap cannot be seen. */
    transition: scale var(--duration-quick) var(--ease-out);
  }

  .pick .boundary {
    fill: var(--land-active);
    stroke-width: var(--stroke-bold);
  }

  /*
   * A small town carries its name outside its own border, so the paper ink
   * cannot count on the active fill behind it. A halo in the active colour
   * gives the name the same background wherever it falls.
   */
  .pick .boundary-text {
    fill: var(--paper);
    paint-order: stroke fill;
    stroke: var(--land-active);
    stroke-width: var(--stroke-halo-wide);
    stroke-linejoin: round;
  }

  /* A village keeps its own outline while it rides up with its town. Its
     name does not: on the active fill it takes the same paper ink and halo
     as the town, and stays quieter by weight alone. */
  .pick .village .boundary {
    fill: var(--paper-sunk);
    stroke: var(--ink);
  }

  @media (prefers-reduced-motion: reduce) {
    .pick {
      transition: none;
    }
  }
</style>
