<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import ParkFlags from '$lib/components/ParkFlags.svelte';
  import CityLocator from '$lib/components/CityLocator.svelte';
  import TownLocator from '$lib/components/TownLocator.svelte';
  import { formatAcres } from '$lib/format';
  import { isCitySection, isCountySection, townKey } from '$lib/municipalities';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();

  /**
   * The section these parks belong to. On a second ordering that is not this
   * page, so nothing here is read off the page's own URL.
   */
  const section = $derived(
    page.section ?? { title: page.title, url: page.url }
  );

  /** Set on a town section the county map draws, and on nothing else. */
  const town = $derived(townKey(section.url));
  /** The county section has no town of its own: it takes the whole map. */
  const county = $derived(isCountySection(section.url));
  /** The city section is drawn with its neighborhoods. */
  const city = $derived(isCitySection(section.url));

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
  const measured = $derived(
    parks.filter((p) => p.park!.acres !== undefined).length
  );
  const SHOWN = 4;

  /**
   * The two orderings of this section. Each is its own static page, so the
   * column heading that sorts is a plain link: the reader can sort with
   * JavaScript off, and can link to what they see.
   */
  const bySize = $derived(page.order === 'size');
  const azUrl = $derived(section.url);
  const sizeUrl = $derived(`${section.url}by-size/`);
  /** A size order needs two figures to compare. See ADR-0001. */
  const sortable = $derived(measured >= 2);
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
        <span><b class="mono">{measured}</b> measured</span>
      </p>
    </div>
    {#if city}
      <div class="locator"><CityLocator /></div>
    {:else if town || county}
      <div class="locator"><TownLocator {town} /></div>
    {/if}
  </div>

  <!-- The heading that orders the table is the control: each ordering is its
       own prerendered page, so it is a link, not a button. See ADR-0001. -->
  <div class="row row--head eyebrow" class:row--head--plain={!sortable}>
    {#if sortable}
      <span class="sort-label">Sort</span>
    {/if}
    <span class="num" aria-hidden="true"></span>
    {#if sortable && bySize}
      <a class="name" href={azUrl}>Park</a>
    {:else}
      <span class="name" aria-current={sortable ? 'page' : undefined}>Park</span
      >
    {/if}
    <span class="status" aria-hidden="true">Status</span>
    <span class="tags" aria-hidden="true">What is there</span>
    {#if sortable && !bySize}
      <a class="end acres" href={sizeUrl}>Size</a>
    {:else}
      <span class="end acres" aria-current={sortable ? 'page' : undefined}
        >Size</span
      >
    {/if}
    <span class="end words" aria-hidden="true">Write-up</span>
  </div>

  <!-- The number is a position in the list, and on the by-size page that
       position is the rank, so the order is named for a screen reader too. -->
  <ol
    class="table"
    aria-label="Parks in {section.title}, {bySize ? 'largest first' : 'A to Z'}"
  >
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
        <span class="mono end acres">
          {#if park.acres !== undefined}{formatAcres(park.acres)} acres{:else}—{/if}
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

  .counts {
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
      '. acres'
      '. words';
    gap: 0.35rem 0.9rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--rule-soft);
  }

  /* Below the table width the grid has no columns to head, so the row keeps
     only the two headings that sort, and says what they do. */
  .row--head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.6rem;
    padding: 0.9rem 0 0.5rem;
    border-bottom: none;
  }

  .row--head .num,
  .row--head .status,
  .row--head .tags,
  .row--head .words {
    display: none;
  }

  /* The headings carry the row's classes for their grid areas, not for the
     type the rows set. */
  .row--head .name,
  .row--head .acres,
  .row--head .words {
    font-size: inherit;
    font-weight: inherit;
    color: inherit;
  }

  .row--head a {
    text-decoration: underline;
    text-underline-offset: 0.25em;
    text-decoration-style: dotted;
  }

  .row--head [aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: 0.25em;
  }

  /* With one ordering there is nothing to sort, so the narrow layout, which
     shows the headings for their links alone, shows no heading row at all. */
  .row--head--plain {
    display: none;
  }

  .sort-label {
    color: var(--ink-faint);
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

  .acres {
    grid-area: acres;
    font-size: 0.75rem;
    color: var(--ink-muted);
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
      grid-template-columns:
        2.5rem minmax(0, 13rem) 5.5rem minmax(0, 1fr)
        6rem 6rem;
      grid-template-areas: 'num name status tags acres words';
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
      padding: 0.4rem 0.875rem;
      border-bottom: 1px solid var(--ink);
      background: none;
    }

    .row--head .num,
    .row--head .status,
    .row--head .tags,
    .row--head .words {
      display: block;
    }

    .row--head--plain {
      display: grid;
    }

    .sort-label {
      display: none;
    }

    .end {
      text-align: right;
    }
  }
</style>
