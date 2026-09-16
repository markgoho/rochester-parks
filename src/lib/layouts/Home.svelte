<script lang="ts">
  import CountyMap from '$lib/components/CountyMap.svelte';
  import type { Page } from '$lib/types';

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

<div class="wrap hero">
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

<section class="stats">
  <div class="wrap stats__grid">
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

<section class="wrap finder">
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

<section class="wrap towns">
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
  <section class="wrap">
    <div class="prose">{@html page.html}</div>
  </section>
{/if}

<style>
  .hero {
    display: grid;
    gap: 2rem;
    padding-top: 2.5rem;
    padding-bottom: 2.5rem;
  }

  .hero__text {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .lede {
    margin: 0;
    font-size: 1.0625rem;
    color: var(--ink-soft);
  }

  /* A town on the county's north edge grows past the top of the map, so the
     line above it stands back far enough to stay clear. */
  .hero__map .eyebrow {
    margin: 0 0 1.75rem;
  }

  .ledger {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--rule);
    max-width: 28rem;
  }

  .ledger a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
    min-height: 3rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--rule);
    font-size: 1.0625rem;
    font-weight: 700;
  }

  .stats {
    background: var(--paper-sunk);
    border-block: 2px solid var(--ink);
  }

  .stats__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
    gap: 1.25rem;
    padding-block: 1.5rem;
  }

  .stats p {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    margin: 0;
  }

  .stats .mono {
    font-size: 2.25rem;
    line-height: 1;
  }

  .stats .accent {
    color: var(--orange-ink);
  }

  .finder,
  .towns {
    display: grid;
    gap: 1.75rem;
    padding-top: 2.75rem;
  }

  .finder h2,
  .towns h2 {
    margin-bottom: 0.75rem;
  }

  .caveat {
    margin: 1rem 0 0;
    font-size: 0.9375rem;
    color: var(--ink-soft);
  }

  .towns__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11rem, 1fr));
    gap: 0 1.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 2px solid var(--ink);
  }

  .towns__grid a {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 2.75rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--rule-soft);
    font-size: 0.9375rem;
  }

  .towns__grid .mono {
    color: var(--ink-muted);
    font-size: 0.8125rem;
  }

  @media (min-width: 60rem) {
    .hero {
      grid-template-columns: minmax(0, 1fr) 34rem;
      align-items: center;
      gap: 3.5rem;
      padding-top: 3.5rem;
    }

    .finder {
      grid-template-columns: minmax(0, 1fr) 30rem;
      align-items: start;
    }
  }

  /* The map holds 28 town names at 8 units in a 673-unit viewBox, so how well
     it reads is decided by how wide it is drawn. Past this width the text
     column has more room than it can use, and the map takes the rest. */
  @media (min-width: 80rem) {
    .hero {
      grid-template-columns: minmax(0, 1fr) 44rem;
    }
  }
</style>
