<script lang="ts">
  import {
    outlineBox,
    project,
    squareBox,
    type Marker,
    type Outline,
  } from '#lib/municipalities.js';
  import { ERIE_CANAL, GENESEE_RIVER } from '#lib/waterways.js';

  /**
   * One shape drawn on its own: a town with the villages inside it, or a
   * city neighborhood, which has none.
   */
  let {
    shape,
    villages = [],
    markers = [],
    label,
    square = false,
    scope,
  }: {
    shape: Outline;
    villages?: Outline[];
    markers?: Marker[];
    label?: string;
    /** Frame the outline in a square, so every town takes the same room. */
    square?: boolean;
    /**
     * A box that holds both the map and a list of the same parks. Each list
     * entry marked `data-park` with a marker's key picks out that marker's
     * dot while the pointer or the focus is on it.
     */
    scope?: string;
  } = $props();

  const box = $derived(
    square ? squareBox(outlineBox(shape)) : outlineBox(shape)
  );
  /**
   * Brockport crosses the Sweden–Clarkson line, so villages are clipped. The
   * river and canal are clipped too, or they would run on past the border.
   */
  const uid = $props.id();
  const clip = `town-clip-${uid}`;

  /**
   * A dot the same size on every town. The box holds the outline at whatever
   * scale makes it fit, so a radius in map units has to follow that scale.
   */
  const DOT = 0.028;

  const dots = $derived(
    markers.map((m) => ({
      title: m.title,
      key: m.key,
      ...project(m.latitude, m.longitude),
    }))
  );

  /**
   * While one entry in the list is picked, its dot grows and the rest fade,
   * so the dot shows even where others crowd it. SVG has no z-index, so a
   * dot cannot simply come to the front.
   *
   * These rules name each park, so they cannot be written by hand in a
   * scoped block. Without `:has()` a reader simply never sees a dot picked.
   */
  const pick = $derived.by(() => {
    if (!scope) return '';
    const keyed = markers.filter((m) => m.key !== undefined);
    if (!keyed.length) return '';
    const on = (key: string) =>
      `${scope}:has([data-park="${key}"]:is(:hover,:focus-within))`;
    return (
      `${scope}:has([data-park]:is(:hover,:focus-within)) [data-dot]{opacity:.3}` +
      keyed
        .map((m) => `${on(m.key!)} [data-dot="${m.key}"]{opacity:1;scale:2}`)
        .join('')
    );
  });
</script>

<svelte:head>
  {#if pick}
    {@html `<style>${pick}</style>`}
  {/if}
</svelte:head>

<svg
  class="town-shape"
  viewBox="{box.x} {box.y} {box.width} {box.height}"
  xmlns="http://www.w3.org/2000/svg"
  role="img"
  aria-label={label ?? shape.name}
>
  <defs>
    <clipPath id={clip}>
      {#each shape.paths as d (d)}
        <path {d} />
      {/each}
    </clipPath>
  </defs>
  {#each shape.paths as d (d)}
    <path class="outline" vector-effect="non-scaling-stroke" {d} />
  {/each}
  {#each villages as village (village.key)}
    <g clip-path="url(#{clip})">
      {#each village.paths as d (d)}
        <path class="village" vector-effect="non-scaling-stroke" {d} />
      {/each}
    </g>
  {/each}
  <path
    class="water river"
    clip-path="url(#{clip})"
    vector-effect="non-scaling-stroke"
    d={GENESEE_RIVER}
  />
  <path
    class="water"
    clip-path="url(#{clip})"
    vector-effect="non-scaling-stroke"
    d={ERIE_CANAL}
  />
  {#each dots as dot (dot.key ?? dot.title)}
    <circle
      class="park"
      data-dot={dot.key}
      cx={dot.x}
      cy={dot.y}
      r={Math.max(box.width, box.height) * DOT}
      vector-effect="non-scaling-stroke"
    />
  {/each}
</svg>

<style>
  .town-shape {
    display: block;
    width: 100%;
    height: auto;
    overflow: visible;
  }

  .outline {
    fill: var(--land);
    stroke: var(--rule-strong);
    stroke-width: var(--stroke-base);
    stroke-linejoin: round;
  }

  /* A village inside the town, the way the county map draws one. */
  .village {
    fill: var(--paper-sunk);
    stroke: var(--rule-strong);
    stroke-width: var(--stroke-base);
    stroke-linejoin: round;
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
    /* A picked dot grows about its own middle. */
    transform-box: fill-box;
    transform-origin: center;
    transition:
      scale var(--duration-quick) var(--ease-out),
      opacity var(--duration-quick) var(--ease-out);
  }

  @media (prefers-reduced-motion: reduce) {
    .park {
      transition: none;
    }
  }
</style>
