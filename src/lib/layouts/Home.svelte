<script lang="ts">
  import CountyMap from '#lib/components/CountyMap.svelte';
  import type { Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  const summary = $derived(page.summary);
  const towns = $derived(
    (summary?.sections ?? []).filter((s) => s.url.startsWith('/town-parks/'))
  );
  const countOf = (url: string) =>
    summary?.sections.find((s) => s.url === url)?.count ?? 0;
  const townTotal = $derived(
    towns.reduce((total, town) => total + town.count, 0)
  );
  const unreachable = $derived(
    (summary?.parks ?? 0) - (summary?.inventoried ?? 0)
  );
  const topAmenities = $derived((summary?.amenities ?? []).slice(0, 5));
</script>

<!-- The frame is the container .hero queries below. A container cannot
     query itself, and <main> itself is the wrong ancestor: .hero sits in
     its narrower "content" column (see app.css), not its full width, so
     the frame reports the space .hero actually renders in. -->
<div class="hero-frame">
  <div class="hero">
  <div class="hero__text">
    <p class="eyebrow rule-in">Monroe County, New York</p>
    <h1>Every park,<br />town by town.</h1>
    <p class="lede measure">{page.description}</p>

    <ul class="ledger">
      <li>
        <a href="/town-parks/"
          ><span>Town parks</span><span class="mono">{townTotal}</span></a
        >
      </li>
      <li>
        <a href="/monroe-county-parks/"
          ><span>Monroe County parks</span><span class="mono"
            >{countOf('/monroe-county-parks/')}</span
          ></a
        >
      </li>
      <li>
        <a href="/rochester-city-parks/"
          ><span>City of Rochester parks</span><span class="mono"
            >{countOf('/rochester-city-parks/')}</span
          ></a
        >
      </li>
      <li>
        <a href="/state-parks/"
          ><span>New York State parks</span><span class="mono"
            >{countOf('/state-parks/')}</span
          ></a
        >
      </li>
    </ul>
  </div>

  <div class="hero__map">
    <p class="eyebrow">Pick a town</p>
    <CountyMap />
  </div>
  </div>
</div>

<section class="stats full-bleed">
  <div class="stats__grid">
    <p>
      <span class="mono">{summary?.parks ?? 0}</span><span class="eyebrow"
        >Parks catalogued</span
      >
    </p>
    <p>
      <span class="mono">{towns.length}</span><span class="eyebrow"
        >Towns, plus city, county and state</span
      >
    </p>
    <p>
      <span class="mono accent">{summary?.written ?? 0}</span><span
        class="eyebrow">Walked and written up</span
      >
    </p>
    <p>
      <span class="mono">{summary?.inventoried ?? 0}</span><span class="eyebrow"
        >With an amenity list</span
      >
    </p>
  </div>
</section>

<!-- The frame is the container .finder queries below, for the same reason
     .hero-frame exists above. -->
<div class="finder-frame">
<section class="finder">
  <div>
    <h2>Or start from what you need.</h2>
    <p class="measure">
      A shelter and a bathroom for Saturday. Swings a toddler can use. Pick the
      things that have to be there and we will show you where somebody has
      confirmed them — and, just as plainly, where nobody has looked.
    </p>
    <a class="button button--ghost" href="/find/">Open the finder</a>
  </div>

  <div class="panel">
    <div class="panel__head">
      <span class="eyebrow">Most recorded</span>
      <span class="eyebrow">{summary?.inventoried ?? 0} parks carry a list</span
      >
    </div>
    <div class="panel__body">
      <ul class="tags">
        {#each topAmenities as amenity (amenity.name)}
          <li>
            <span class="tag"
              >{amenity.name} <span class="count">{amenity.count}</span></span
            >
          </li>
        {/each}
      </ul>
      <p class="caveat">
        <strong class="mono">{unreachable}</strong> parks have no amenity list at
        all. They are not missing a shelter — nobody has written down whether they
        have one.
      </p>
    </div>
  </div>
</section>
</div>

<section class="towns">
  <h2>The towns</h2>
  <ul class="towns__grid">
    {#each towns as town (town.url)}
      <li>
        <a href={town.url}
          ><span>{town.title}</span><span class="mono">{town.count}</span></a
        >
      </li>
    {/each}
  </ul>
</section>

{#if page.html}
  <div class="prose">{@html page.html}</div>
{/if}

<style>
  .hero {
    display: grid;
    gap: var(--space-32);
    padding-top: var(--space-40);
    padding-bottom: var(--space-40);
  }

  .hero__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-20);
  }

  .lede {
    margin: 0;
    font-size: var(--step-1);
    color: var(--ink-soft);
  }

  /* A town on the county's north edge grows past the top of the map, so the
     line above it stands back far enough to stay clear. */
  .hero__map .eyebrow {
    margin: 0 0 var(--space-28);
  }

  .ledger {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: var(--line-hair) solid var(--rule);
    max-width: 28rem;
  }

  .ledger a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-16);
    min-height: var(--control-height);
    padding: var(--space-8) 0;
    border-bottom: var(--line-hair) solid var(--rule);
    font-size: var(--step-1);
    font-weight: var(--weight-bold);
  }

  .stats {
    background: var(--paper-sunk);
    border-block: var(--line-heavy) solid var(--ink);
  }

  .stats__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: var(--space-20);
    padding-block: var(--space-24);
  }

  .stats p {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
    margin: 0;
  }

  .stats .mono {
    font-size: var(--step-4);
    line-height: var(--leading-none);
  }

  .stats .accent {
    color: var(--orange-ink);
  }

  .finder,
  .towns {
    display: grid;
    gap: var(--space-28);
    padding-top: var(--space-44);
  }

  .finder h2,
  .towns h2 {
    margin-bottom: var(--space-12);
  }

  .caveat {
    margin: var(--space-16) 0 0;
    font-size: var(--step-0);
    color: var(--ink-soft);
  }

  .towns__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 0 var(--space-28);
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: var(--line-heavy) solid var(--ink);
  }

  .towns__grid a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-12);
    min-height: var(--tap-target);
    padding: var(--space-6) 0;
    border-bottom: var(--line-hair) solid var(--rule-soft);
    font-size: var(--step--1);
  }

  .towns__grid .mono {
    color: var(--ink-muted);
    font-size: var(--step--1);
  }

  .hero-frame {
    container: hero / inline-size;
  }

  .finder-frame {
    container: finder / inline-size;
  }

  /* 20rem text + 34rem map + 3.5rem gap = 57.5rem. */
  @container hero (inline-size >= 57.5rem) {
    .hero {
      grid-template-columns: minmax(20rem, 1fr) 34rem;
      align-items: center;
      gap: var(--space-56);
      padding-top: var(--space-56);
    }
  }

  /* .finder has its own, smaller need: 20rem text + 30rem panel + 1.75rem
     gap = 51.75rem. */
  @container finder (inline-size >= 51.75rem) {
    .finder {
      grid-template-columns: minmax(20rem, 1fr) 30rem;
      align-items: start;
    }
  }

  /* The map holds 28 town names at 8 units in a 673-unit viewBox, so how well
     it reads is decided by how wide it is drawn. Once the text column has
     grown as wide as the map's own first size, the extra room should go to
     the map instead: 34rem text + 44rem map + 3.5rem gap = 81.5rem. (The
     frame cannot pass 84.5rem, --page-max minus 2 * --gutter, so a larger
     text minimum here would make this rule unreachable.) */
  @container hero (inline-size >= 81.5rem) {
    .hero {
      grid-template-columns: minmax(34rem, 1fr) 44rem;
    }
  }
</style>
