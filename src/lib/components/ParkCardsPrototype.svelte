<script lang="ts">
  /**
   * PROTOTYPE (park cards). Three card views of a park list, beside the
   * table. Throwaway: see the prototype/park-cards branch.
   *
   * The site ships no client JS, so the view is picked by the URL hash:
   * `#view-a`, `#view-b`, `#view-c`. No hash is the table. Each view's sort
   * links carry its hash, so a sort keeps the view.
   */
  import ParkFlags from '#lib/components/ParkFlags.svelte';
  import TownShape from '#lib/components/TownShape.svelte';
  import { formatAcres, parkTransitionName } from '#lib/format.js';
  import {
    municipality,
    placeAt,
    villagesIn,
    type Outline,
  } from '#lib/municipalities.js';
  import { neighborhoodAt } from '#lib/neighborhoods.js';
  import type { ChildLink } from '#lib/types.js';

  let {
    parks,
    city,
    bySize,
    sortable,
    azUrl,
    sizeUrl,
    placed,
  }: {
    parks: ChildLink[];
    city: boolean;
    bySize: boolean;
    sortable: boolean;
    azUrl: string;
    sizeUrl: string;
    placed: Set<string | undefined>;
  } = $props();

  const VIEWS = [
    { key: 'a', name: 'Photo or place' },
    { key: 'b', name: 'Index card' },
    { key: 'c', name: 'Mosaic' },
  ];
  const dev = import.meta.env.DEV;

  /** The shape a park with no photo is drawn on, with its one dot. */
  function placeOf(
    child: ChildLink
  ): { shape: Outline; villages: Outline[] } | undefined {
    const geo = child.park!.geo;
    if (!geo) return undefined;
    if (city) {
      const n = neighborhoodAt(geo.latitude, geo.longitude);
      return n && { shape: n, villages: [] };
    }
    const key = placeAt(geo.latitude, geo.longitude);
    const m = key && municipality(key);
    return m ? { shape: m, villages: villagesIn(key) } : undefined;
  }

  /** The largest park in the list, the scale every size glyph is drawn to. */
  const maxAcres = $derived(
    Math.max(1, ...parks.map((p) => p.park!.acres ?? 0))
  );

  const rank = (i: number) => String(i + 1).padStart(2, '0');
</script>

<!-- The same two controls on every card view: the order, as links to the
     prerendered orderings, and the way back to the table. -->
{#snippet toolbar(key: string)}
  <div class="toolbar eyebrow">
    {#if sortable}
      <nav class="toolbar__group" aria-label="Order">
        <span class="toolbar__label">Sort</span>
        {#if bySize}
          <a href="{azUrl}#view-{key}">A to Z</a>
          <span aria-current="page">Size</span>
        {:else}
          <span aria-current="page">A to Z</span>
          <a href="{sizeUrl}#view-{key}">Size</a>
        {/if}
      </nav>
    {/if}
    <nav class="toolbar__group" aria-label="View">
      <span class="toolbar__label">Show as</span>
      <a href="#list">List</a>
      <span aria-current="page">Cards</span>
    </nav>
  </div>
{/snippet}

<!-- Grey scale under a paper wash, with the ink in the shadows: the photo
     takes the site's two colours until the card is under the pointer or the
     focus. -->
{#snippet duotone(src: string)}
  <span class="duotone"><img {src} alt="" loading="lazy" /></span>
{/snippet}

{#snippet facts(child: ChildLink)}
  {@const park = child.park!}
  <span class="mono facts">
    {#if park.acres !== undefined}{formatAcres(park.acres)} acres{:else}not
      measured{/if}
    {#if park.amenities.length}· {park.amenities.length}
      {park.amenities.length === 1 ? 'amenity' : 'amenities'}{/if}
  </span>
{/snippet}

<div class="cards-proto">
  <span id="view-a" class="target"></span>
  <span id="view-b" class="target"></span>
  <span id="view-c" class="target"></span>

  <!-- A: every card has a picture. Where there is no photo, the picture is
       where the park is: its town or neighborhood with the park's one dot. -->
  <section class="view view--a" aria-label="Parks as cards">
    {@render toolbar('a')}
    <ol class="grid-a">
      {#each parks as child, i (child.url)}
        {@const park = child.park!}
        {@const place = park.photo ? undefined : placeOf(child)}
        <li
          class="card-a"
          data-park={placed.has(child.url) ? child.url : undefined}
          style:view-transition-name={parkTransitionName(child.url, 'row')}
        >
          <a class="card-a__link" href={child.url}>
            <span class="card-a__media">
              {#if park.photo}
                {@render duotone(park.photo)}
              {:else if place}
                <span class="card-a__place">
                  <TownShape
                    shape={place.shape}
                    villages={place.villages}
                    markers={[{ title: child.title, ...park.geo! }]}
                    square
                    label="Where {child.title} is in {place.shape.name}"
                  />
                </span>
              {:else}
                <span class="card-a__none eyebrow">No photo or place yet</span>
              {/if}
              <span class="mono card-a__num">{rank(i)}</span>
            </span>
            <span
              class="card-a__name"
              style:view-transition-name={parkTransitionName(child.url, 'name')}
              >{child.title}</span
            >
          </a>
          {@render facts(child)}
          <ParkFlags status={park.status} />
        </li>
      {/each}
    </ol>
  </section>

  <!-- B: no picture box. The card is type and figures, led by the size. The
       edge holds the photo when there is one, and otherwise a square drawn
       to the park's size against the largest park in the list. -->
  <section class="view view--b" aria-label="Parks as index cards">
    {@render toolbar('b')}
    <ol class="grid-b">
      {#each parks as child, i (child.url)}
        {@const park = child.park!}
        <li
          class="card-b"
          data-park={placed.has(child.url) ? child.url : undefined}
          style:view-transition-name={parkTransitionName(child.url, 'row')}
        >
          <span class="card-b__edge" aria-hidden="true">
            {#if park.photo}
              {@render duotone(park.photo)}
            {:else if park.acres !== undefined}
              <span
                class="card-b__square"
                style:--size={Math.sqrt(park.acres / maxAcres)}
              ></span>
            {/if}
          </span>
          <span class="card-b__body">
            <span class="mono card-b__num">{rank(i)}</span>
            <span class="card-b__stat">
              {#if park.acres !== undefined}
                <b>{formatAcres(park.acres)}</b> acres
              {:else}
                <b>—</b> not measured
              {/if}
            </span>
            <a class="card-b__name" href={child.url}
              ><span
                style:view-transition-name={parkTransitionName(
                  child.url,
                  'name'
                )}>{child.title}</span
              ></a
            >
            <span class="card-b__tags">
              {#each park.amenities.slice(0, 6) as amenity (amenity)}
                <span class="tag">{amenity}</span>
              {:else}
                <span class="mono none">amenities not recorded yet</span>
              {/each}
              {#if park.amenities.length > 6}
                <span class="tag tag--off">+{park.amenities.length - 6}</span>
              {/if}
            </span>
            <ParkFlags status={park.status} />
          </span>
        </li>
      {/each}
    </ol>
  </section>

  <!-- C: the few photos carry the page. A photographed park takes a big
       tile; every other park is a small tile, shaded by its size. -->
  <section class="view view--c" aria-label="Parks as a mosaic">
    {@render toolbar('c')}
    <ol class="grid-c">
      {#each parks as child, i (child.url)}
        {@const park = child.park!}
        <li
          class="tile"
          class:tile--photo={park.photo}
          data-park={placed.has(child.url) ? child.url : undefined}
          style:view-transition-name={parkTransitionName(child.url, 'row')}
          style:--size={park.acres !== undefined
            ? Math.sqrt(park.acres / maxAcres)
            : 0}
        >
          <a class="tile__link" href={child.url}>
            {#if park.photo}
              {@render duotone(park.photo)}
            {/if}
            <span class="tile__text">
              <span class="mono tile__num">{rank(i)}</span>
              <span
                class="tile__name"
                style:view-transition-name={parkTransitionName(
                  child.url,
                  'name'
                )}>{child.title}</span
              >
              {@render facts(child)}
            </span>
          </a>
        </li>
      {/each}
    </ol>
  </section>

  {#if dev}
    <!-- Not part of the design: flips between the views. Dev only. -->
    <nav class="switcher" aria-label="Prototype views">
      <a href="#list" class="switcher__list">Table</a>
      {#each VIEWS as v (v.key)}
        <a href="#view-{v.key}" class="switcher__{v.key}"
          >{v.key.toUpperCase()} · {v.name}</a
        >
      {/each}
    </nav>
  {/if}
</div>

<style>
  .cards-proto {
    container: cards / inline-size;
  }

  /* The hash picks the view. No hash, or any other, leaves the table. */
  .target {
    display: block;
    scroll-margin-top: var(--space-16);
  }

  .view {
    display: none;
  }

  .cards-proto:has(#view-a:target) .view--a,
  .cards-proto:has(#view-b:target) .view--b,
  .cards-proto:has(#view-c:target) .view--c {
    display: block;
  }

  ol {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-10) var(--space-24);
    padding: var(--space-14) 0 var(--space-8);
    margin-bottom: var(--space-16);
    border-bottom: var(--line-hair) solid var(--ink);
  }

  .toolbar__group {
    display: flex;
    gap: var(--space-14);
  }

  .toolbar__label {
    color: var(--ink-faint);
  }

  .toolbar a {
    text-decoration: underline dotted;
    text-underline-offset: var(--underline-offset);
  }

  .toolbar [aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
  }

  .facts,
  .none {
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  /* Duotone: the photo in grey, multiplied onto paper, then lightened with
     the ink, so black becomes ink and white stays paper. */
  .duotone {
    position: relative;
    display: block;
    block-size: 100%;
    overflow: hidden;
    background: var(--paper);
  }

  .duotone img {
    display: block;
    inline-size: 100%;
    block-size: 100%;
    object-fit: cover;
    filter: grayscale(1) contrast(1.1);
    mix-blend-mode: multiply;
    transition:
      filter var(--duration-quick) var(--ease-out),
      scale 400ms var(--ease-out);
  }

  .duotone::after {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--ink);
    mix-blend-mode: lighten;
    transition: opacity var(--duration-quick) var(--ease-out);
  }

  li:focus-within .duotone img {
    filter: none;
    scale: 1.03;
  }

  li:focus-within .duotone::after {
    opacity: 0;
  }

  @media (hover: hover) {
    li:hover .duotone img {
      filter: none;
      scale: 1.03;
    }

    li:hover .duotone::after {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .duotone img,
    .duotone::after {
      transition: none;
      scale: none;
    }
  }

  /* A: photo or place. */
  .grid-a {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-24) var(--space-20);
  }

  .card-a {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .card-a__link {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }

  .card-a__media {
    position: relative;
    display: block;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border: var(--line-hair) solid var(--rule);
    background: var(--paper-sunk);
  }

  .card-a__place {
    display: grid;
    place-items: center;
    block-size: 100%;
    padding: var(--space-12);
  }

  .card-a__place :global(.town-shape) {
    block-size: 100%;
    inline-size: auto;
  }

  .card-a__none {
    display: grid;
    place-items: center;
    block-size: 100%;
    background: repeating-linear-gradient(
      -45deg,
      var(--paper-sunk) 0 6px,
      var(--rule-soft) 6px 7px
    );
  }

  .card-a__num {
    position: absolute;
    inset-block-start: var(--space-8);
    inset-inline-start: var(--space-8);
    padding: 0.1em 0.4em;
    background: var(--paper);
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  /* Orange while its dot on the town map is picked, as in the table. */
  .card-a__name,
  .card-b__name span,
  .tile__name {
    color: var(--park-picked);
  }

  .card-a__name {
    display: inline-block;
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
    view-transition-class: park-name;
  }

  .card-a__link:is(:hover, :focus-visible) .card-a__name {
    color: var(--orange-ink);
  }

  /* B: index card. */
  .grid-b {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 21rem), 1fr));
    gap: var(--space-16);
  }

  .card-b {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    border: var(--line-hair) solid var(--rule);
    border-block-start: var(--line-accent) solid var(--ink);
    background: var(--card);
  }

  .card-b:has(a:is(:hover, :focus-visible)) {
    border-block-start-color: var(--orange);
  }

  .card-b__edge {
    position: relative;
    display: grid;
    align-items: end;
    justify-items: center;
    padding-block-end: var(--space-12);
    background: var(--land);
  }

  .card-b__edge:has(.duotone) {
    padding: 0;
    align-items: stretch;
    justify-items: stretch;
  }

  /* Area, not side, follows acres, so the side is the square root. */
  .card-b__square {
    inline-size: max(4px, calc(var(--size) * 4rem));
    aspect-ratio: 1;
    background: var(--ink-soft);
  }

  .card-b__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-8);
    padding: var(--space-12) var(--space-14) var(--space-14);
  }

  .card-b__num {
    font-size: var(--text-2xs);
    color: var(--ink-faint);
  }

  .card-b__stat {
    font-family: var(--mono);
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  .card-b__stat b {
    display: block;
    font-family: var(--display);
    font-size: var(--text-stat-sm);
    font-weight: var(--weight-regular);
    line-height: var(--leading-none);
    color: var(--ink);
  }

  .card-b__name {
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
  }

  .card-b__name span {
    display: inline-block;
    view-transition-class: park-name;
  }

  .card-b__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
  }

  /* C: mosaic. */
  .grid-c {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
    grid-auto-rows: 9.5rem;
    grid-auto-flow: dense;
    gap: var(--space-8);
  }

  .tile {
    overflow: hidden;
    border: var(--line-hair) solid var(--rule);
    /* The land rises with the park's size, like water in a glass. */
    background: linear-gradient(
      to top,
      var(--land) calc(var(--size) * 100%),
      var(--card) 0
    );
  }

  .tile--photo {
    grid-column: span 2;
    grid-row: span 2;
    border-color: var(--ink);
  }

  @container cards (inline-size < 22rem) {
    .tile--photo {
      grid-column: auto;
    }
  }

  .tile__link {
    position: relative;
    display: block;
    block-size: 100%;
  }

  .tile__link .duotone {
    position: absolute;
    inset: 0;
  }

  .tile__text {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    block-size: 100%;
    padding: var(--space-10);
  }

  .tile--photo .tile__text {
    justify-content: flex-end;
    padding: var(--space-16);
    background: linear-gradient(to top, var(--ink) 0, transparent 55%);
    color: var(--paper);
  }

  .tile__num {
    font-size: var(--text-2xs);
    color: var(--ink-faint);
  }

  .tile__name {
    display: inline-block;
    font-weight: var(--weight-bold);
    line-height: var(--leading-snug);
    view-transition-class: park-name;
  }

  .tile--photo .tile__name {
    font-family: var(--display);
    font-size: var(--text-xl);
    font-weight: var(--weight-regular);
  }

  .tile--photo :is(.tile__num, .facts) {
    color: var(--on-orange-quiet);
  }

  .tile:not(.tile--photo) .tile__link:is(:hover, :focus-visible) .tile__name {
    color: var(--orange-ink);
  }

  /* Not part of the design. */
  .switcher {
    position: fixed;
    inset-block-end: var(--space-16);
    inset-inline-start: 50%;
    translate: -50% 0;
    z-index: 100;
    max-inline-size: calc(100vw - 2rem);
    overflow-x: auto;
    display: flex;
    gap: var(--space-4);
    padding: var(--space-4);
    border-radius: 999px;
    background: #111;
    box-shadow: 0 6px 24px rgb(0 0 0 / 0.35);
    font:
      600 0.8125rem/1 system-ui,
      sans-serif;
    white-space: nowrap;
  }

  .switcher a {
    padding: 0.6rem 0.9rem;
    border-radius: 999px;
    color: #eee;
    text-decoration: none;
  }

  .cards-proto:not(:has(.target:target)) .switcher__list,
  .cards-proto:has(#view-a:target) .switcher__a,
  .cards-proto:has(#view-b:target) .switcher__b,
  .cards-proto:has(#view-c:target) .switcher__c {
    background: #fff;
    color: #111;
  }
</style>
