<script lang="ts">
  import {
    outlineBox,
    project,
    type Marker,
    type Outline,
  } from '#lib/municipalities.js';
  import { ERIE_CANAL } from '#lib/erie-canal.js';

  /**
   * One shape drawn on its own: a town with the villages inside it, or a
   * city neighborhood, which has none.
   */
  let {
    shape,
    villages = [],
    markers = [],
    label,
  }: {
    shape: Outline;
    villages?: Outline[];
    markers?: Marker[];
    label?: string;
  } = $props();

  const box = $derived(outlineBox(shape));
  /**
   * Brockport crosses the Sweden–Clarkson line, so villages are clipped. The
   * canal is clipped too, or it would run on past the town's border.
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
      ...project(m.latitude, m.longitude),
    }))
  );
</script>

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
    class="canal"
    clip-path="url(#{clip})"
    vector-effect="non-scaling-stroke"
    d={ERIE_CANAL}
  />
  {#each dots as dot (dot.title)}
    <circle
      class="park"
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

  /* The Erie Canal, beneath the dots. It is a picture only, so it never
     takes the pointer from a link. */
  .canal {
    fill: none;
    stroke: var(--water);
    stroke-width: var(--stroke-water);
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  /* The park this page is about, in the one accent the site allows. */
  .park {
    fill: var(--orange);
    stroke: var(--ink);
    stroke-width: var(--stroke-base);
  }
</style>
