<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import ParkFlags from '#lib/components/ParkFlags.svelte';
  import Tip from '#lib/components/Tip.svelte';
  import CityLocator from '#lib/components/CityLocator.svelte';
  import TownLocator from '#lib/components/TownLocator.svelte';
  import TownShape from '#lib/components/TownShape.svelte';
  import { formatAcres, parkTransitionName } from '#lib/format.js';
  import {
    isCitySection,
    isCountySection,
    municipality,
    placeAt,
    townAt,
    townKey,
    villagesIn,
  } from '#lib/municipalities.js';
  import { neighborhoodAt, neighborhoodUrl } from '#lib/neighborhoods.js';
  import type { HoursView, Page } from '#lib/types.js';

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
  const hours = $derived(page.hours);
  const hasHours = $derived(
    hours !== undefined &&
      (hours.grounds !== undefined || hours.facilities.length > 0)
  );
  /** One line of grounds hours fits a column; anything more needs the width. */
  const longHours = $derived(
    hours !== undefined &&
      (hours.facilities.length > 0 ||
        (hours.grounds !== undefined &&
          (hours.grounds.lines.length > 1 ||
            hours.grounds.note !== undefined ||
            hours.grounds.closedOn !== undefined)))
  );
  /**
   * The official page is where the facts come from (ADR-0004), so it is
   * cited on its own. The other links stay under "Elsewhere".
   */
  const official = $derived(
    park?.links.find((item) => item.label === 'Official page')
  );
  const elsewhere = $derived(
    park?.links.filter((item) => item !== official) ?? []
  );
  /** The site the facts come from, as a reader would name it. */
  const officialHost = $derived(
    official ? new URL(official.url).hostname.replace(/^www\./, '') : ''
  );
  const uid = $props.id();
  /** The panel is worth drawing only once one of its rows has content. */
  const hasBasics = $derived(
    hasHours ||
      Boolean(address) ||
      park?.acres !== undefined ||
      (park?.links.length ?? 0) > 0
  );
  const recorded = $derived(
    [status?.written, status?.inventoried, status?.photographed].filter(Boolean)
      .length
  );
</script>

<article>
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <header class="head">
    <div class="head__text">
      <!-- The name shares its view-transition-name with the park's row in a
           Park List, so it moves between the list and this heading. -->
      <h1>
        <span
          class="title"
          style:view-transition-name={parkTransitionName(page.url, 'name')}
          >{page.title}</span
        >
      </h1>
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

  {#snippet hoursOf(view: HoursView, name?: string)}
    <div class="hours__place">
      {#if name}<p class="hours__name">{name}</p>{/if}
      {#each view.lines as line (line)}<p>{line}</p>{/each}
      {#if view.note}<p class="hours__note">{view.note}</p>{/if}
      {#if view.closedOn}<p class="hours__note">{view.closedOn}</p>{/if}
    </div>
  {/snippet}

  {#if park && hasBasics}
    <section class="panel basics">
      <div class="panel__head">
        <span class="eyebrow">The basics</span>
      </div>
      <dl class="panel__body facts">
        <!-- Hours take the full width only when they are long. One line of
             hours, or an em dash, sits in line with the other facts. -->
        <div class="fact" class:fact--wide={longHours}>
          <dt class="eyebrow">
            Hours
            {#if hours?.checkedOn}
              <button
                type="button"
                class="checked"
                style="anchor-name: --tip-{uid}-checked"
                aria-label="Hours checked {hours.checkedOn}"
                interestfor="tip-{uid}-checked"
                popovertarget="tip-{uid}-checked">i</button
              >
              <Tip id="tip-{uid}-checked" anchor="--tip-{uid}-checked"
                >Hours checked {hours.checkedOn}</Tip
              >
            {/if}
          </dt>
          <dd class="hours">
            {#if hours && hasHours}
              {#if hours.grounds}
                {@render hoursOf(
                  hours.grounds,
                  hours.facilities.length ? 'Grounds' : undefined
                )}
              {/if}
              {#each hours.facilities as facility (facility.name)}
                {@render hoursOf(facility, facility.name)}
              {/each}
            {:else}
              —
            {/if}
          </dd>
        </div>
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
        {#if official}
          <div class="fact">
            <dt class="eyebrow">Source</dt>
            <dd class="links">
              <a href={official.url} rel="noopener"
                ><cite>{officialHost}</cite></a
              >
            </dd>
          </div>
        {/if}
        {#if elsewhere.length}
          <div class="fact">
            <dt class="eyebrow">Elsewhere</dt>
            <dd class="links">
              {#each elsewhere as item (item.url)}
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
  /* A named element must be one box, so a name that wraps cannot be an inline
     span. */
  .title {
    display: inline-block;
    view-transition-class: park-name;
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    padding-bottom: var(--space-20);
  }

  .head__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-12);
    min-width: 0;
  }

  .where {
    width: 9rem;
    margin: 0;
  }

  .where figcaption {
    margin-top: var(--space-6);
    text-align: center;
  }

  @media (min-width: 60rem) {
    /* The outline sits beside the title, the park marked on it. */
    .head {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 9rem;
      align-items: start;
      gap: var(--space-40);
    }

    .where {
      justify-self: end;
    }
  }

  .status {
    display: flex;
    align-items: center;
    gap: var(--space-10);
    margin: 0;
  }

  .empty,
  .basics,
  .amenities {
    margin-bottom: var(--space-24);
  }

  .facts {
    display: grid;
    gap: var(--space-14);
    margin: 0;
  }

  .fact dt {
    margin-bottom: var(--space-4);
  }

  .fact dd {
    margin: 0;
  }

  .hours {
    display: grid;
    gap: var(--space-10);
  }

  .hours p {
    margin: 0;
  }

  .hours__name {
    font-weight: var(--weight-bold);
  }

  .hours__note {
    color: var(--ink-soft);
  }

  /* The "hours checked" trigger: a small circled i beside the label. */
  .checked {
    display: inline-grid;
    place-items: center;
    width: 1.25rem;
    height: 1.25rem;
    margin-left: var(--space-4);
    padding: 0;
    border: var(--line-hair) solid var(--rule-strong);
    border-radius: 50%;
    background: none;
    color: inherit;
    font: inherit;
    text-transform: none;
    cursor: pointer;
    vertical-align: middle;
  }

  .checked:hover,
  .checked:focus-visible {
    border-color: var(--ink);
    color: var(--ink);
  }

  cite {
    font-style: normal;
  }

  .links {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-6) var(--space-20);
  }

  .links a {
    font-weight: var(--weight-bold);
  }

  @media (min-width: 40rem) {
    .facts {
      grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
      gap: var(--space-20);
    }

    .fact--wide {
      grid-column: 1 / -1;
    }
  }

  .empty p {
    margin: 0;
    max-width: var(--measure);
    color: var(--ink-soft);
  }

  .amenities .tags {
    gap: var(--space-6);
  }

  .sub {
    margin-top: var(--space-40);
  }

  .sub ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8);
    margin: var(--space-8) 0 0;
    padding: 0;
    list-style: none;
  }

  .sub a {
    display: inline-flex;
    align-items: center;
    min-height: var(--tap-target);
    padding: 0 var(--space-16);
    border: var(--line-hair) solid var(--rule-strong);
    background: var(--card);
    font-weight: var(--weight-bold);
  }

  .paging {
    display: grid;
    gap: var(--line-hair);
    margin-top: var(--space-40);
    background: var(--rule);
    border-block: var(--line-hair) solid var(--rule);
  }

  .paging__link {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-4);
    min-height: 4.75rem;
    padding: var(--space-14) var(--space-16);
    background: var(--paper);
  }

  .paging__title {
    font-weight: var(--weight-bold);
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
