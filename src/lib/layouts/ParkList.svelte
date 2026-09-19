<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import ParkFlags from '#lib/components/ParkFlags.svelte';
  import CityLocator from '#lib/components/CityLocator.svelte';
  import TownLocator from '#lib/components/TownLocator.svelte';
  import TownShape from '#lib/components/TownShape.svelte';
  import { formatAcres, parkTransitionName } from '#lib/format.js';
  import {
    isCitySection,
    isCountySection,
    municipality,
    placeAt,
    townKey,
    villagesIn,
    type Marker,
    type Outline,
  } from '#lib/municipalities.js';
  import { neighborhoodAt } from '#lib/neighborhoods.js';
  import type { ChildLink, Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  /**
   * The section these parks belong to. On a second ordering that is not this
   * page, so nothing here is read off the page's own URL.
   */
  const section = $derived(
    page.section ?? { title: page.title, url: page.url }
  );

  /** Set on a town section, and on nothing else. */
  const town = $derived(townKey(section.url));
  const townShape = $derived(town ? municipality(town) : undefined);
  /** The county section has no town of its own: it takes the whole map. */
  const county = $derived(isCountySection(section.url));
  /** The city section is drawn with its neighborhoods. */
  const city = $derived(isCitySection(section.url));

  const parks = $derived(
    page.children.filter((child) => child.park !== undefined)
  );
  /**
   * The city's parks, one group per Neighborhood that holds any, by name. A
   * park with no coordinates cannot be placed, so it waits in a last group.
   */
  const groups = $derived.by(() => {
    if (!city) return [];
    const byKey = new Map<
      string,
      { key: string; name: string; parks: ChildLink[] }
    >();
    const unplaced: ChildLink[] = [];
    for (const child of parks) {
      const geo = child.park!.geo;
      const n = geo ? neighborhoodAt(geo.latitude, geo.longitude) : undefined;
      if (!n) {
        unplaced.push(child);
        continue;
      }
      const group = byKey.get(n.key) ?? { key: n.key, name: n.name, parks: [] };
      group.parks.push(child);
      byKey.set(n.key, group);
    }
    const placed = [...byKey.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { numeric: true })
    );
    return unplaced.length
      ? [
          ...placed,
          { key: 'not-placed', name: 'Not placed yet', parks: unplaced },
        ]
      : placed;
  });
  /** How many parks each Neighborhood holds, for the map's links. */
  const counts = $derived(
    new Map(
      groups
        .filter((g) => g.key !== 'not-placed')
        .map((g) => [g.key, g.parks.length])
    )
  );
  const byNeighborhood = $derived(page.order === 'neighborhood');

  /**
   * The table or the cards. Each is its own static page, one level below the
   * ordering, so every link to another ordering stays in the same view. See
   * ADR-0008.
   */
  const cards = $derived(page.view === 'cards');
  const view = $derived(cards ? 'cards/' : '');
  const neighborhoodUrl = $derived(`${section.url}by-neighborhood/${view}`);

  /** A dot for each park with a place, keyed on its URL like its row. */
  const markers: Marker[] = $derived(
    parks.flatMap((child) => {
      const geo = child.park!.geo;
      return geo ? [{ title: child.title, key: child.url, ...geo }] : [];
    })
  );
  const placed = $derived(new Set(markers.map((m) => m.key)));

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
  /** The default order, by title, which every other order links back to. */
  const az = $derived(page.order === undefined);
  const azUrl = $derived(`${section.url}${view}`);
  const sizeUrl = $derived(`${section.url}by-size/${view}`);
  /** This ordering, as a table and as cards. */
  const orderUrl = $derived(
    `${section.url}${bySize ? 'by-size/' : byNeighborhood ? 'by-neighborhood/' : ''}`
  );
  const tableUrl = $derived(orderUrl);
  const cardsUrl = $derived(`${orderUrl}cards/`);
  /** A size order needs two figures to compare. See ADR-0001. */
  const sortable = $derived(measured >= 2);

  /**
   * What a card with no photo shows instead: the town or the Neighborhood
   * that holds the park, with the park's one dot. A county park is drawn on
   * the town it stands in.
   */
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
    const shape = key ? municipality(key) : undefined;
    return shape && key ? { shape, villages: villagesIn(key) } : undefined;
  }
</script>

<Breadcrumbs ancestors={page.ancestors} current={page} />

<!-- The list is the container the town layout queries, and the box a row
     picks its dot inside. A container cannot query itself, so the grid is
     the element inside it. -->
<div class="list">
  <div class="layout" class:layout--town={townShape}>
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
        <div class="locator locator--city">
          <CityLocator {counts} />
          <p class="eyebrow map-hint">Pick a neighborhood to see its parks</p>
        </div>
      {:else if county}
        <div class="locator"><TownLocator /></div>
      {/if}
    </div>

    {#if townShape && town}
      <!-- The town with a dot for each park. The dot of the row under the
       pointer or the focus grows. -->
      <div class="town-map">
        <TownShape
          shape={townShape}
          villages={villagesIn(town)}
          {markers}
          square
          scope=".list"
          label="The parks of {section.title}"
        />
      </div>
    {/if}

    {#snippet parkRow(child: ChildLink, i: number)}
      {@const park = child.park!}
      <!-- Every ordering of a section names a park's row the same way, so a
       browser with view transitions moves each row to its new place. The
       park's name has a name of its own, which the Park page's heading
       shares, so the name moves from the list into the heading. -->
      <li
        class="row"
        data-park={placed.has(child.url) ? child.url : undefined}
        style:view-transition-name={parkTransitionName(child.url, 'row')}
      >
        <span class="mono num">{String(i + 1).padStart(2, '0')}</span>
        <a class="name" href={child.url}
          ><span
            class="name__text"
            style:view-transition-name={parkTransitionName(child.url, 'name')}
            >{child.title}</span
          ></a
        >
        <span class="status"><ParkFlags status={park.status} /></span>
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
    {/snippet}

    <!-- A park as a card. Its picture is its photo, in the site's two colours
     until the card is under the pointer or the focus. A park with no photo
     shows where it is instead. The card takes the row's transition names, so
     a park moves between the table and the cards. -->
    {#snippet parkCard(child: ChildLink, i: number)}
      {@const park = child.park!}
      {@const place = park.photo ? undefined : placeOf(child)}
      <li
        class="card"
        data-park={placed.has(child.url) ? child.url : undefined}
        style:view-transition-name={parkTransitionName(child.url, 'row')}
      >
        <a class="card__link" href={child.url}>
          <span class="card__media">
            {#if park.photo}
              <span class="duotone"
                ><img src={park.photo} alt="" loading="lazy" /></span
              >
            {:else if place}
              <span class="card__place">
                <TownShape
                  shape={place.shape}
                  villages={place.villages}
                  markers={[{ title: child.title, ...park.geo! }]}
                  square
                  label="Where {child.title} is in {place.shape.name}"
                />
              </span>
            {:else}
              <span class="card__none eyebrow">Not placed yet</span>
            {/if}
            <span class="mono card__num">{String(i + 1).padStart(2, '0')}</span>
          </span>
          <span
            class="name__text card__name"
            style:view-transition-name={parkTransitionName(child.url, 'name')}
            >{child.title}</span
          >
        </a>
        <span class="mono card__facts">
          {[
            park.acres !== undefined
              ? `${formatAcres(park.acres)} acres`
              : 'not measured',
            park.amenities.length === 1
              ? '1 amenity'
              : park.amenities.length
                ? `${park.amenities.length} amenities`
                : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
        <ParkFlags status={park.status} />
      </li>
    {/snippet}

    {#snippet parkList(items: ChildLink[], label: string)}
      {#if cards}
        <ol class="cards" aria-label={label}>
          {#each items as child, i (child.url)}
            {@render parkCard(child, i)}
          {/each}
        </ol>
      {:else}
        <ol class="table" aria-label={label}>
          {#each items as child, i (child.url)}
            {@render parkRow(child, i)}
          {/each}
        </ol>
      {/if}
    {/snippet}

    <div class="body">
      <!-- Each ordering and each view is its own prerendered page, so these
       are links. The table's own headings sort it, so the order links here
       are for the cards, and for the city's grouping. -->
      <div class="toolbar eyebrow" class:toolbar--cards={cards}>
        {#if city || (cards && sortable)}
          <nav class="toolbar__group" aria-label="Order">
            {#if cards}<span class="toolbar__label">Sort</span>{/if}
            {#if az}
              <span aria-current="page">A to Z</span>
            {:else}
              <a href={azUrl}>A to Z</a>
            {/if}
            {#if cards && sortable}
              {#if bySize}
                <span aria-current="page">Size</span>
              {:else}
                <a href={sizeUrl}>Size</a>
              {/if}
            {/if}
            {#if city}
              {#if byNeighborhood}
                <span aria-current="page">By neighborhood</span>
              {:else}
                <a href={neighborhoodUrl}>By neighborhood</a>
              {/if}
            {/if}
          </nav>
        {/if}
        <nav class="toolbar__group toolbar__views" aria-label="View">
          <span class="toolbar__label">Show as</span>
          {#if cards}
            <a href={tableUrl}>List</a>
            <span aria-current="page">Cards</span>
          {:else}
            <span aria-current="page">List</span>
            <a href={cardsUrl}>Cards</a>
          {/if}
        </nav>
      </div>

      <!-- The heading that orders the table is the control: each ordering is its
     own prerendered page, so it is a link, not a button. See ADR-0001. -->
      {#if !cards}
        <div class="row row--head eyebrow" class:row--head--plain={!sortable}>
          {#if sortable}
            <span class="sort-label">Sort</span>
          {/if}
          <span class="num" aria-hidden="true"></span>
          {#if !az}
            <a class="name" href={azUrl}>Park</a>
          {:else}
            <span class="name" aria-current={sortable ? 'page' : undefined}
              >Park</span
            >
          {/if}
          <span class="status" aria-hidden="true">Status</span>
          <span class="tags" aria-hidden="true">What is there</span>
          {#if sortable && !bySize}
            <a class="end acres" href={sizeUrl}>Size</a>
          {:else}
            <span class="end acres" aria-current={bySize ? 'page' : undefined}
              >Size</span
            >
          {/if}
          <span class="end words" aria-hidden="true">Write-up</span>
        </div>
      {/if}

      {#if byNeighborhood}
        {#each groups as group (group.key)}
          <section class="group" id={group.key}>
            <h2 class="group__head">
              {group.name}
              <span class="mono eyebrow"
                >{group.parks.length === 1
                  ? '1 park'
                  : `${group.parks.length} parks`}</span
              >
            </h2>
            {@render parkList(group.parks, `Parks in ${group.name}, A to Z`)}
          </section>
        {/each}
      {:else}
        <!-- The number is a position in the list, and on the by-size page that
       position is the rank, so the order is named for a screen reader too. -->
        {@render parkList(
          parks,
          `Parks in ${section.title}, ${bySize ? 'largest first' : 'A to Z'}`
        )}
      {/if}

      {#if other.length}
        <h2 class="more">More about this section</h2>
        <ul class="other">
          {#each other as child (child.url)}
            <li><a href={child.url}>{child.title}</a></li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>

<style>
  /* The list is the container the town layout below queries. */
  .list {
    container: list / inline-size;
  }

  .town-map {
    max-inline-size: 24rem;
    padding-top: var(--space-20);
  }

  /* Wide: the town map beside the list, on screen while the list scrolls,
     so the dot a row picks is always in sight. */
  @container list (inline-size >= 68rem) {
    .layout--town {
      display: grid;
      grid-template-columns: minmax(0, 1fr) clamp(20rem, 28%, 28rem);
      grid-template-rows: auto 1fr;
      column-gap: var(--space-40);
    }

    .layout--town .town-map {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: start;
      max-inline-size: none;
      padding-top: 0;
      position: sticky;
      top: var(--space-24);
    }
  }

  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding-bottom: var(--space-20);
    border-bottom: var(--line-heavy) solid var(--ink);
  }

  .head__text {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
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
    gap: var(--space-8) var(--space-24);
    margin: 0;
    align-items: center;
  }

  .counts b {
    color: var(--ink);
    font-size: var(--text-sm);
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
    gap: var(--space-6) var(--space-14);
    padding: var(--space-12) 0;
    border-bottom: var(--line-hair) solid var(--rule-soft);
  }

  /* Below the table width the grid has no columns to head, so the row keeps
     only the two headings that sort, and says what they do. */
  .row--head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-10);
    padding: var(--space-14) 0 var(--space-8);
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
    text-underline-offset: var(--underline-offset);
    text-decoration-style: dotted;
  }

  .row--head [aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
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
    font-size: var(--text-2xs);
    color: var(--ink-faint);
  }

  .name {
    grid-area: name;
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
  }

  /* A named element must be one box, so a name that wraps cannot be an inline
     span. */
  .name__text {
    display: inline-block;
    view-transition-class: park-name;
    /* Orange while its dot on the town map is picked. Unset, the name takes
       the link's own colour. */
    color: var(--park-picked);
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
    gap: var(--space-4);
  }

  .acres {
    grid-area: acres;
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  .words {
    grid-area: words;
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  .none {
    font-size: var(--text-2xs);
    color: var(--ink-faint);
  }

  .more {
    margin: var(--space-40) 0 var(--space-12);
  }

  .map-hint {
    margin: var(--space-8) 0 0;
    text-align: center;
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-10) var(--space-24);
    padding-top: var(--space-14);
  }

  .toolbar--cards {
    padding-bottom: var(--space-8);
    margin-bottom: var(--space-20);
    border-bottom: var(--line-hair) solid var(--ink);
  }

  .toolbar__group {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-8) var(--space-20);
  }

  /* The view switch sits at the end of the line, even alone on it. */
  .toolbar__views {
    margin-inline-start: auto;
    gap: var(--space-14);
  }

  .toolbar__label {
    color: var(--ink-faint);
  }

  .toolbar a {
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
    text-decoration-style: dotted;
  }

  .toolbar [aria-current='page'] {
    color: var(--ink);
    text-decoration: underline;
    text-underline-offset: var(--underline-offset);
  }

  /* As many columns as fit, each at least 15rem, so the grid breaks where
     the cards do. */
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
    gap: var(--space-24) var(--space-20);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .group .cards {
    padding-top: var(--space-16);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  .card__link {
    display: flex;
    flex-direction: column;
    gap: var(--space-10);
  }

  .card__media {
    position: relative;
    display: block;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    border: var(--line-hair) solid var(--rule);
    background: var(--paper-sunk);
  }

  .card__place {
    display: grid;
    place-items: center;
    block-size: 100%;
    padding: var(--space-12);
  }

  .card__place :global(.town-shape) {
    block-size: 100%;
    inline-size: auto;
  }

  .card__none {
    display: grid;
    place-items: center;
    block-size: 100%;
    background: repeating-linear-gradient(
      -45deg,
      var(--paper-sunk) 0 6px,
      var(--rule-soft) 6px 7px
    );
  }

  .card__num {
    position: absolute;
    inset-block-start: var(--space-8);
    inset-inline-start: var(--space-8);
    padding: 0.1em 0.4em;
    background: var(--paper);
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  .card__name {
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
  }

  .card__link:is(:hover, :focus-visible) .card__name {
    color: var(--orange-ink);
  }

  .card__facts {
    font-size: var(--text-2xs);
    color: var(--ink-muted);
  }

  /* Duotone: the photo in grey, multiplied onto paper, then lightened with
     the ink, so black becomes ink and white stays paper. */
  .duotone {
    position: relative;
    display: block;
    block-size: 100%;
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

  .card:focus-within .duotone img {
    filter: none;
    scale: 1.03;
  }

  .card:focus-within .duotone::after {
    opacity: 0;
  }

  @media (hover: hover) {
    .card:hover .duotone img {
      filter: none;
      scale: 1.03;
    }

    .card:hover .duotone::after {
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

  .group {
    scroll-margin-top: var(--space-16);
  }

  .group__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-16);
    margin: var(--space-32) 0 0;
    padding: 0 0 var(--space-6);
    border-bottom: var(--line-hair) solid var(--ink);
  }

  /* The group the map sent the reader to. */
  .group:target .group__head {
    color: var(--orange);
  }

  .other {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: var(--line-hair) solid var(--rule);
  }

  .other a {
    display: flex;
    align-items: center;
    min-height: var(--tap-target);
    border-bottom: var(--line-hair) solid var(--rule-soft);
    font-weight: var(--weight-bold);
  }

  @media (min-width: 60rem) {
    /* The county map sits beside the heading, not above the table. */
    .head:has(.locator) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 13rem;
      align-items: start;
      gap: var(--space-40);
    }

    .locator {
      justify-self: end;
    }

    /* Forty-eight neighborhoods need more room than one town to be picked. */
    .head:has(.locator--city) {
      grid-template-columns: minmax(0, 1fr) 20rem;
    }

    .locator--city {
      width: 20rem;
    }

    .row {
      grid-template-columns:
        2.5rem minmax(0, 13rem) 5.5rem minmax(0, 1fr)
        6rem 6rem;
      grid-template-areas: 'num name status tags acres words';
      align-items: center;
      gap: var(--space-16);
      padding: var(--space-8) var(--space-14);
    }

    .row:nth-child(even) {
      background: var(--paper-zebra);
    }

    .row--head {
      display: grid;
      min-height: 2.25rem;
      padding: var(--space-6) var(--space-14);
      border-bottom: var(--line-hair) solid var(--ink);
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
