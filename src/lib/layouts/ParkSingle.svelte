<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import ParkFlags from '$lib/components/ParkFlags.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();

  const park = $derived(page.park);
  const status = $derived(park?.status);
  const recorded = $derived(
    [status?.written, status?.inventoried, status?.photographed].filter(Boolean)
      .length
  );
</script>

<article class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <header class="head">
    <h1>{page.title}</h1>
    {#if park}
      <p class="status">
        <ParkFlags status={park.status} />
      </p>
    {/if}
  </header>

  {#if park && recorded === 0}
    <div class="panel empty">
      <div class="panel__head">
        <span class="eyebrow">What we know</span>
        <span class="eyebrow eyebrow--accent mono">0 of 3</span>
      </div>
      <div class="panel__body">
        <p>
          Nobody has walked {page.title} and written it up, and there is no list
          of what is there. What this page can tell you honestly is where it is and
          who looks after it. The rest is waiting on a visit.
        </p>
      </div>
    </div>
  {/if}

  {#if park && park.amenities.length}
    <section class="panel amenities">
      <div class="panel__head">
        <span class="eyebrow">What is there</span>
        <span class="eyebrow mono">{park.amenities.length} recorded</span>
      </div>
      <ul class="panel__body tags">
        {#each park.amenities as amenity (amenity)}
          <li><span class="tag">{amenity}</span></li>
        {/each}
      </ul>
    </section>
  {/if}

  <div class="prose">{@html page.html}</div>

  {#if page.children.length}
    <nav class="sub" aria-label="More about this park">
      <p class="eyebrow">More about {page.title}</p>
      <ul>
        {#each page.children as child (child.url)}
          <li><a href={child.url}>{child.title}</a></li>
        {/each}
      </ul>
    </nav>
  {/if}

  {#if page.neighbours?.previous || page.neighbours?.next}
    <nav class="paging" aria-label="Other parks in {park?.section.title}">
      {#if page.neighbours.previous}
        <a class="paging__link" href={page.neighbours.previous.url}>
          <span class="eyebrow">Previous in {park?.section.title}</span>
          <span class="paging__title">{page.neighbours.previous.title}</span>
        </a>
      {:else}
        <span></span>
      {/if}
      {#if page.neighbours.next}
        <a
          class="paging__link paging__link--end"
          href={page.neighbours.next.url}
        >
          <span class="eyebrow">Next in {park?.section.title}</span>
          <span class="paging__title">{page.neighbours.next.title}</span>
        </a>
      {/if}
    </nav>
  {/if}
</article>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-bottom: 1.25rem;
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0;
  }

  .empty,
  .amenities {
    margin-bottom: 1.5rem;
  }

  .empty p {
    margin: 0;
    max-width: var(--measure);
    color: var(--ink-soft);
  }

  .amenities .tags {
    gap: 0.35rem;
  }

  .sub {
    margin-top: 2.5rem;
  }

  .sub ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0.5rem 0 0;
    padding: 0;
    list-style: none;
  }

  .sub a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0 1rem;
    border: 1px solid var(--rule-strong);
    background: var(--card);
    font-weight: 700;
  }

  .paging {
    display: grid;
    gap: 1px;
    margin-top: 2.5rem;
    background: var(--rule);
    border-block: 1px solid var(--rule);
  }

  .paging__link {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 0.25rem;
    min-height: 4.75rem;
    padding: 0.9rem 1rem;
    background: var(--paper);
  }

  .paging__title {
    font-weight: 700;
  }

  @media (min-width: 40rem) {
    .paging {
      grid-template-columns: 1fr 1fr;
    }

    .paging__link--end {
      text-align: right;
    }
  }
</style>
