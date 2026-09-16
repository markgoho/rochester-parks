<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import ParkFlags from '$lib/components/ParkFlags.svelte';
  import StatusIcon from '$lib/components/StatusIcon.svelte';
  import TownLocator from '$lib/components/TownLocator.svelte';
  import { townKey } from '$lib/municipalities';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();

  /** Set on a town section the county map draws, and on nothing else. */
  const town = $derived(townKey(page.url));

  const parks = $derived(
    page.children.filter((child) => child.park !== undefined)
  );
  const other = $derived(
    page.children.filter((child) => child.park === undefined)
  );
  const written = $derived(parks.filter((p) => p.park!.status.written).length);
  const inventoried = $derived(
    parks.filter((p) => p.park!.status.inventoried).length
  );
  const photographed = $derived(
    parks.filter((p) => p.park!.status.photographed).length
  );
  const SHOWN = 4;
</script>

<div class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <div class="head">
    <div class="head__text">
      <h1>{page.title}</h1>
      {#if page.html}
        <div class="prose intro">{@html page.html}</div>
      {/if}
      <p class="eyebrow counts">
        <span><b class="mono">{parks.length}</b> parks</span>
        <span><b class="mono">{written}</b> written up</span>
        <span><b class="mono">{photographed}</b> photographed</span>
        <span><b class="mono">{inventoried}</b> with amenity data</span>
      </p>
    </div>
    {#if town}
      <div class="locator"><TownLocator {town} /></div>
    {/if}
  </div>

  <p class="eyebrow key">
    <span>Key</span>
    <span
      ><b class="flag flag--on"><StatusIcon kind="written" /></b> written up</span
    >
    <span
      ><b class="flag flag--on"><StatusIcon kind="photographed" /></b> photographed</span
    >
    <span
      ><b class="flag flag--on"><StatusIcon kind="inventoried" /></b> amenities recorded</span
    >
    <span class="key__sort">Sorted A–Z · nothing is ranked here</span>
  </p>

  <ol class="table">
    <li class="row row--head eyebrow" aria-hidden="true">
      <span></span><span>Park</span><span>Status</span><span>What is there</span
      ><span class="end">Write-up</span>
    </li>
    {#each parks as child, i (child.url)}
      {@const park = child.park!}
      <li class="row">
        <span class="mono num">{String(i + 1).padStart(2, '0')}</span>
        <a class="name" href={child.url}>{child.title}</a>
        <span class="status"
          ><ParkFlags status={park.status} label={false} /></span
        >
        <span class="tags">
          {#each park.amenities.slice(0, SHOWN) as amenity (amenity)}
            <span class="tag">{amenity}</span>
          {/each}
          {#if park.amenities.length > SHOWN}
            <span class="tag tag--off"
              >+{park.amenities.length - SHOWN} more</span
            >
          {:else if park.amenities.length === 0}
            <span class="mono none">not recorded yet</span>
          {/if}
        </span>
        <span class="mono end words">
          {#if park.status.written}{park.wordCount} words{:else if park.wordCount > 0}short
            note{:else}—{/if}
        </span>
      </li>
    {/each}
  </ol>

  {#if other.length}
    <h2 class="more">More about this section</h2>
    <ul class="other">
      {#each other as child (child.url)}
        <li><a href={child.url}>{child.title}</a></li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    padding-bottom: 1.25rem;
    border-bottom: 2px solid var(--ink);
  }

  .head__text {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    min-width: 0;
  }

  .locator {
    width: 13rem;
    max-width: 100%;
  }

  .intro :global(p:last-child) {
    margin-bottom: 0;
  }

  .counts,
  .key {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    margin: 0;
    align-items: center;
  }

  .counts b {
    color: var(--ink);
    font-size: 0.9375rem;
  }

  .key {
    padding: 0.9rem 0 0.5rem;
  }

  .key span {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .key__sort {
    margin-left: auto;
  }

  .table {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr);
    grid-template-areas:
      'num name'
      '. status'
      '. tags'
      '. words';
    gap: 0.35rem 0.9rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--rule-soft);
  }

  .row--head {
    display: none;
  }

  .num {
    grid-area: num;
    font-size: 0.75rem;
    color: var(--ink-faint);
  }

  .name {
    grid-area: name;
    font-size: 1.0625rem;
    font-weight: 700;
  }

  .status {
    grid-area: status;
    display: flex;
    align-items: center;
  }

  .tags {
    grid-area: tags;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .words {
    grid-area: words;
    font-size: 0.75rem;
    color: var(--ink-muted);
  }

  .none {
    font-size: 0.75rem;
    color: var(--ink-faint);
  }

  .more {
    margin: 2.5rem 0 0.75rem;
  }

  .other {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid var(--rule);
  }

  .other a {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    border-bottom: 1px solid var(--rule-soft);
    font-weight: 700;
  }

  @media (min-width: 60rem) {
    /* The county map sits beside the heading, not above the table. */
    .head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 13rem;
      align-items: start;
      gap: 2.5rem;
    }

    .locator {
      justify-self: end;
    }

    .row {
      grid-template-columns: 2.5rem minmax(0, 15rem) 5.5rem minmax(0, 1fr) 7rem;
      grid-template-areas: 'num name status tags words';
      align-items: center;
      gap: 1.1rem;
      padding: 0.5rem 0.875rem;
    }

    .row:nth-child(even) {
      background: var(--paper-zebra);
    }

    .row--head {
      display: grid;
      min-height: 2.25rem;
      padding-block: 0.4rem;
      border-bottom: 1px solid var(--ink);
      background: none;
    }

    .end {
      text-align: right;
    }
  }
</style>
