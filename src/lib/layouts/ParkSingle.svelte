<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import ParkFlags from '#lib/components/ParkFlags.svelte';
  import Tip from '#lib/components/Tip.svelte';
  import CityLocator from '#lib/components/CityLocator.svelte';
  import TownLocator from '#lib/components/TownLocator.svelte';
  import TownShape from '#lib/components/TownShape.svelte';
  import {
    formatAcres,
    formatCoordinates,
    hostOf,
    longestWord,
    parkTransitionName,
    telHref,
  } from '#lib/format.js';
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
  const officialHost = $derived(official ? hostOf(official.url) : '');
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
  const facilities = $derived(park?.facilities ?? []);
</script>

<!-- The article is the container the layout queries. A container cannot query
     itself, so the grid is the element inside it. -->
<article class="park">
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <div class="layout">
    <header class="head">
      <!-- The name shares its view-transition-name with the park's row in a
           Park List, so it moves between the list and this heading. -->
      <h1 style:--longest-word={longestWord(page.title)}>
        <span
          class="title"
          style:view-transition-name={parkTransitionName(page.url, 'name')}
          >{page.title}</span
        >
      </h1>
    </header>

    {#snippet hoursOf(view: HoursView, name?: string)}
      <div class="hours__place">
        {#if name}<p class="hours__name">{name}</p>{/if}
        {#each view.lines as line (line)}<p>{line}</p>{/each}
        {#if view.note}<p class="hours__note">{view.note}</p>{/if}
        {#if view.closedOn}<p class="hours__note">{view.closedOn}</p>{/if}
      </div>
    {/snippet}

    {#if park}
      <!-- The facts about the park. Beside the write-up when there is room for
           both, above it when there is not. -->
      <aside class="rail" aria-label="About {page.title}">
        <section class="panel basics">
          <div class="panel__head">
            <span class="eyebrow">The basics</span>
            <ParkFlags status={park.status} />
          </div>
          <div class="panel__body">
            <!-- Where the park is: the outline beside the facts it stands for. -->
            {#if (park.geo && where) || address}
              <div class="place" class:place--map={park.geo && where}>
                {#if park.geo && where}
                  <div class="map">
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
                  </div>
                {/if}
                <dl class="facts">
                  {#if where}
                    <div class="fact">
                      <dt class="eyebrow">Where</dt>
                      <dd>
                        {#if neighborhood}<a
                            href={neighborhoodUrl(neighborhood.key)}>{where}</a
                          >{:else}{where}{/if}
                      </dd>
                    </div>
                  {/if}
                  {#if address}
                    <div class="fact">
                      <dt class="eyebrow">Address</dt>
                      <dd>{address}</dd>
                    </div>
                  {/if}
                  {#if park.geo}
                    <div class="fact">
                      <dt class="eyebrow">Coordinates</dt>
                      <dd class="mono">{formatCoordinates(park.geo)}</dd>
                    </div>
                  {/if}
                </dl>
              </div>
            {/if}

            <dl class="facts facts--grid">
              <!-- Hours take the full width only when they are long. One line
                   of hours, or an em dash, sits in line with the other facts. -->
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
          </div>
        </section>

      </aside>
    {/if}

    <div class="body">
      <!-- What is there heads the write-up rather than the rail. The list
           grows with the park, and a rail that holds both panels outgrows the
           screen, which would leave the reader scrolling the rail. -->
      {#if park?.amenities.length}
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

      {#if park && recorded === 0}
        <div class="panel empty">
          <div class="panel__head">
            <span class="eyebrow">What we know</span>
            <span class="eyebrow eyebrow--accent mono">0 of 3</span>
          </div>
          <div class="panel__body">
            <p>
              Nobody has walked {page.title} and written it up, and there is no list
              of what is there. What this page can tell you honestly is where it
              is and who looks after it. The rest is waiting on a visit.
            </p>
          </div>
        </div>
      {/if}

      <div class="prose">{@html page.html}</div>

      <!-- Facilities are a heading on this page, not a page of their own
           (ADR-0007), so the section sits in the body with a real heading. The
           rail's panels label themselves with an eyebrow, which `#facilities`
           could not point at. Hours stay in the panel beside the grounds'
           hours; this section says what each Facility is and how to book it. -->
      {#if facilities.length}
        <section class="facilities" id="facilities">
          <h2>Facilities</h2>
          <ul>
            {#each facilities as facility (facility.name)}
              {@const rental = facility.rental}
              <li class="facility">
                <h3>{facility.name}</h3>
                {#if rental?.season}
                  <!-- The season is printed as its source writes it, so it
                       takes a label rather than a sentence around it. -->
                  <p class="facility__line">
                    <span class="eyebrow">Rented</span>
                    {rental.season}
                  </p>
                {/if}
                {#if rental && (rental.url || rental.phone)}
                  <p class="facility__line facility__book">
                    <span class="eyebrow">Book it</span>
                    {#if rental.url}
                      <a href={rental.url} rel="noopener"
                        >{hostOf(rental.url)}</a
                      >
                    {/if}
                    {#if rental.phone}
                      <a href={telHref(rental.phone)}>{rental.phone}</a>
                    {/if}
                  </p>
                {/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}

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
    </div>
  </div>

  {#if page.neighbours?.previous || page.neighbours?.next}
    <nav class="paging" aria-label="Other parks in {park?.section.title}">
      {#if page.neighbours.previous}
        <a class="paging__link" href={page.neighbours.previous.url}>
          <span class="eyebrow">Previous in {park?.section.title}</span>
          <span class="paging__title">{page.neighbours.previous.title}</span>
        </a>
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

  /* The article is the container the layout below queries. */
  .park {
    container: park / inline-size;
  }

  /* Narrow: the name, the facts, then the write-up, in one column. */
  .layout {
    display: grid;
    gap: var(--space-24);
  }

  .head,
  .body {
    min-width: 0;
  }

  /* The rail holds one panel, above the write-up or beside it. */
  .rail {
    display: grid;
    align-items: start;
  }

  /* Wide: the facts move to a rail beside the write-up. That takes a line of
     prose at --measure (68ch of Public Sans, 41.6rem), the gap, and the rail
     at 21em, which is about 23rem where the query fires. Below that, a rail
     beside the text would squeeze both, so the facts stay above it.

     The rail holds an address, a pair of coordinates and a host name, so its
     width is a count of letters, not of pixels. An em keeps that count the
     same when the type grows: the page is capped at --page-max, so a wide
     screen does not widen a rem rail, and its text then runs out of room. */
  @container park (inline-size >= 68rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 21em;
      grid-template-rows: auto 1fr;
      column-gap: var(--space-56);
    }

    .head,
    .body {
      grid-column: 1;
    }

    .rail {
      grid-column: 2;
      grid-row: 1 / span 2;
      /* The rail stays on screen while the write-up scrolls. It does not
         fill its grid area, so it has room to move. A rail taller than the
         screen scrolls by itself, so its last panel is never out of reach. */
      align-self: start;
      position: sticky;
      top: var(--space-24);
      max-block-size: calc(100dvh - 2 * var(--space-24));
      overflow-y: auto;
    }
  }

  /* The two panels in the body column line up with the prose under them. */
  .empty,
  .amenities {
    max-width: var(--measure);
    margin-bottom: var(--space-24);
  }

  /* Where the park is: its outline beside the facts that place it. */
  .place--map {
    display: grid;
    grid-template-columns: 8em minmax(0, 1fr);
    align-items: center;
    gap: var(--space-20);
  }

  /* A rule between where the park is and the rest of the facts. */
  .place + .facts {
    margin-top: var(--space-16);
    padding-top: var(--space-16);
    border-top: var(--line-hair) solid var(--rule);
  }

  .facts {
    display: grid;
    gap: var(--space-14);
    margin: 0;
  }

  .facts--grid {
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 9em), 1fr));
    gap: var(--space-20);
  }

  .fact--wide {
    grid-column: 1 / -1;
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

  .empty p {
    margin: 0;
    max-width: var(--measure);
    color: var(--ink-soft);
  }

  .amenities .tags {
    gap: var(--space-6);
  }

  /* The Facilities section reads as part of the write-up above it, so its
     heading takes the same size and rhythm as a heading inside the prose. */
  .facilities {
    max-width: var(--measure);
    margin-top: var(--space-40);
  }

  .facilities h2 {
    margin: 0 0 var(--space-12);
    font-size: var(--step-2);
  }

  /* One Facility per card, in as many columns as the body has room for, so the
     row breaks where the content breaks and not at a device width. */
  .facilities ul {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
    gap: var(--space-16);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .facility {
    padding: var(--space-14) var(--space-16);
    border: var(--line-hair) solid var(--rule);
    background: var(--card);
  }

  .facility h3 {
    margin: 0;
    font-size: var(--step-0);
  }

  .facility__line {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-4) var(--space-8);
    margin: var(--space-8) 0 0;
    color: var(--ink-soft);
  }

  /* The section sits beside the write-up, not inside it, so it cannot take
     the `.prose a` rule and states the same three properties itself. */
  .facility__book a {
    color: var(--orange-ink);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset-prose);
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
    margin-top: var(--space-40);
    background: var(--paper);
    border-block: var(--line-hair) solid var(--rule);
  }

  .paging__link {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: var(--space-4);
    min-height: 4.75rem;
    padding: var(--space-14) var(--space-16);
  }

  /* The divider belongs to the second link, so it shows only when two links
     exist. */
  .paging__link + .paging__link {
    border-block-start: var(--line-hair) solid var(--rule);
  }

  .paging__title {
    font-weight: var(--weight-bold);
  }

  /* The paging nav sits in the article, so it queries the same "park"
     container as the rail above. .park sits in <main>'s content column,
     inside the page's 2 * 1.25rem margin (the gutter is still the narrow
     one below 48rem), so 40rem (640px) of viewport is 36.5625rem (585px)
     here. */
  @container park (inline-size >= 36.5625rem) {
    .paging {
      grid-template-columns: 1fr 1fr;
    }

    .paging__link + .paging__link {
      border-block-start: 0;
      border-inline-start: var(--line-hair) solid var(--rule);
    }

    .paging__link--end {
      grid-column: 2;
      text-align: right;
    }
  }
</style>
