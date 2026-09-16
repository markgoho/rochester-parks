<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import ParkFlags from '$lib/components/ParkFlags.svelte';
  import CityLocator from '$lib/components/CityLocator.svelte';
  import TownLocator from '$lib/components/TownLocator.svelte';
  import TownShape from '$lib/components/TownShape.svelte';
  import { formatAcres } from '$lib/format';
  import {
    isCitySection,
    isCountySection,
    municipality,
    placeAt,
    townAt,
    townKey,
    villagesIn,
  } from '$lib/municipalities';
  import { neighborhoodAt, neighborhoodUrl } from '$lib/neighborhoods';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();

  const park = $derived(page.park);
  const county = $derived(
    park !== undefined && isCountySection(park.section.url)
  );
  const city = $derived(park !== undefined && isCitySection(park.section.url));
  /**
   * The town to draw. The coordinates decide it, so a park filed under one
   * section but standing in another is shown where it really is; the section
   * is only the fallback. A county park has no town section to fall back on,
   * and several stand in the city, so the city counts as a place for it. A
   * city park is drawn on its neighborhood instead.
   */
  const town = $derived(
    park?.geo && !city
      ? county
        ? placeAt(park.geo.latitude, park.geo.longitude)
        : (townAt(park.geo.latitude, park.geo.longitude) ??
          townKey(park.section.url))
      : undefined
  );
  const neighborhood = $derived(
    park?.geo && city
      ? neighborhoodAt(park.geo.latitude, park.geo.longitude)
      : undefined
  );
  const shape = $derived(
    neighborhood ?? (town ? municipality(town) : undefined)
  );
  const villages = $derived(town ? villagesIn(town) : []);
  /**
   * A county park whose point falls outside every outline still gets the
   * county map rather than no map at all, and a city park outside every
   * neighborhood gets the city map.
   */
  const where = $derived(
    neighborhood?.name ??
      (town ? municipality(town)?.label.text : undefined) ??
      (county ? 'Monroe County' : city ? 'Rochester' : undefined)
  );
  const status = $derived(park?.status);
  /** The address on one line, with any part the front matter left out dropped. */
  const address = $derived(
    park?.address
      ? [
          park.address.streetAddress,
          park.address.addressLocality,
          [park.address.addressRegion, park.address.postalCode]
            .filter(Boolean)
            .join(' '),
        ]
          .filter(Boolean)
          .join(', ')
      : undefined
  );
  /** The panel is worth drawing only once one of its three rows has content. */
  const hasBasics = $derived(
    Boolean(address) ||
      park?.acres !== undefined ||
      (park?.links.length ?? 0) > 0
  );
  const recorded = $derived(
    [status?.written, status?.inventoried, status?.photographed].filter(Boolean)
      .length
  );
</script>

<article class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <header class="head">
    <div class="head__text">
      <h1>{page.title}</h1>
      {#if park}
        <p class="status">
          <ParkFlags status={park.status} />
        </p>
      {/if}
    </div>
    {#if park?.geo && where}
      <figure class="where">
        {#if shape}
          <TownShape
            {shape}
            {villages}
            label="{page.title} in {where}"
            markers={[{ title: page.title, ...park.geo }]}
          />
        {:else if city}
          <CityLocator
            label="{page.title} in {where}"
            markers={[{ title: page.title, ...park.geo }]}
          />
        {:else}
          <TownLocator
            label="{page.title} in {where}"
            markers={[{ title: page.title, ...park.geo }]}
          />
        {/if}
        <figcaption class="eyebrow">
          In {#if neighborhood}<a href={neighborhoodUrl(neighborhood.key)}
              >{where}</a
            >{:else}{where}{/if}
        </figcaption>
      </figure>
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

  {#if park && hasBasics}
    <section class="panel basics">
      <div class="panel__head">
        <span class="eyebrow">The basics</span>
      </div>
      <dl class="panel__body facts">
        {#if address}
          <div class="fact">
            <dt class="eyebrow">Address</dt>
            <dd>{address}</dd>
          </div>
        {/if}
        {#if park.acres !== undefined}
          <div class="fact">
            <dt class="eyebrow">Size</dt>
            <dd class="mono">{formatAcres(park.acres)} acres</dd>
          </div>
        {/if}
        {#if park.links.length}
          <div class="fact">
            <dt class="eyebrow">Elsewhere</dt>
            <dd class="links">
              {#each park.links as item (item.url)}
                <a href={item.url} rel="noopener">{item.label}</a>
              {/each}
            </dd>
          </div>
        {/if}
      </dl>
    </section>
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

  .head__text {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  .where {
    width: 9rem;
    margin: 0;
  }

  .where figcaption {
    margin-top: 0.4rem;
    text-align: center;
  }

  @media (min-width: 60rem) {
    /* The outline sits beside the title, the park marked on it. */
    .head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 9rem;
      align-items: start;
      gap: 2.5rem;
    }

    .where {
      justify-self: end;
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin: 0;
  }

  .empty,
  .basics,
  .amenities {
    margin-bottom: 1.5rem;
  }

  .facts {
    display: grid;
    gap: 0.9rem;
    margin: 0;
  }

  .fact dt {
    margin-bottom: 0.2rem;
  }

  .fact dd {
    margin: 0;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem 1.25rem;
  }

  .links a {
    font-weight: 700;
  }

  @media (min-width: 40rem) {
    .facts {
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: 1.25rem;
    }
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
