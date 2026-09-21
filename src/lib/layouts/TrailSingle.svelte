<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import ParkFlags from '#lib/components/ParkFlags.svelte';
  import Tip from '#lib/components/Tip.svelte';
  import TownLocator from '#lib/components/TownLocator.svelte';
  import TownShape from '#lib/components/TownShape.svelte';
  import {
    formatAcres,
    formatCoordinates,
    hostOf,
    longestWord,
  } from '#lib/format.js';
  import { municipality, placeAt, villagesIn } from '#lib/municipalities.js';
  import type { HoursView, Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  // A Trail shows the same facts a Park page shows where they apply
  // (ADR-0006), reusing the Park machinery, but it is never called a Park:
  // no literal "park" wording appears below.
  const trail = $derived(page.trail);
  /**
   * The town a Trail's point falls in. Every trailhead the site records
   * today stands in Monroe County, so this always tries the county-wide
   * lookup rather than branching on a city or town section the way a Park
   * page does.
   */
  const town = $derived(
    trail?.geo ? placeAt(trail.geo.latitude, trail.geo.longitude) : undefined
  );
  const shape = $derived(town ? municipality(town) : undefined);
  const villages = $derived(town ? villagesIn(town) : []);
  const where = $derived(shape?.label.text);
  const status = $derived(trail?.status);
  const address = $derived(
    trail?.address
      ? [
          trail.address.streetAddress,
          trail.address.addressLocality,
          [trail.address.addressRegion, trail.address.postalCode]
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
  const longHours = $derived(
    hours !== undefined &&
      (hours.facilities.length > 0 ||
        (hours.grounds !== undefined &&
          (hours.grounds.lines.length > 1 ||
            hours.grounds.note !== undefined ||
            hours.grounds.closedOn !== undefined)))
  );
  const official = $derived(
    trail?.links.find((item) => item.label === 'Official page')
  );
  const elsewhere = $derived(
    trail?.links.filter((item) => item !== official) ?? []
  );
  const officialHost = $derived(official ? hostOf(official.url) : '');
  const uid = $props.id();
  const hasBasics = $derived(
    hasHours ||
      Boolean(address) ||
      trail?.acres !== undefined ||
      (trail?.links.length ?? 0) > 0
  );
  const recorded = $derived(
    [status?.written, status?.inventoried, status?.photographed].filter(
      Boolean
    ).length
  );
</script>

<article class="trail">
  <Breadcrumbs ancestors={page.ancestors} current={page} />

  <div class="layout">
    <header class="head">
      <h1 style:--longest-word={longestWord(page.title)}>{page.title}</h1>
    </header>

    {#snippet hoursOf(view: HoursView, name?: string)}
      <div class="hours__place">
        {#if name}<p class="hours__name">{name}</p>{/if}
        {#each view.lines as line (line)}<p>{line}</p>{/each}
        {#if view.note}<p class="hours__note">{view.note}</p>{/if}
        {#if view.closedOn}<p class="hours__note">{view.closedOn}</p>{/if}
      </div>
    {/snippet}

    {#if trail && hasBasics}
      <aside class="rail" aria-label="About {page.title}">
        <section class="panel basics">
          <div class="panel__head">
            <span class="eyebrow">The basics</span>
            <ParkFlags status={trail.status} />
          </div>
          <div class="panel__body">
            {#if (trail.geo && where) || address}
              <div class="place" class:place--map={trail.geo && where}>
                {#if trail.geo && where}
                  <div class="map">
                    {#if shape}
                      <TownShape
                        {shape}
                        {villages}
                        label="{page.title} in {where}"
                        markers={[{ title: page.title, ...trail.geo }]}
                      />
                    {:else}
                      <TownLocator
                        label="{page.title} in {where}"
                        markers={[{ title: page.title, ...trail.geo }]}
                      />
                    {/if}
                  </div>
                {/if}
                <dl class="facts">
                  {#if where}
                    <div class="fact">
                      <dt class="eyebrow">Where</dt>
                      <dd>{where}</dd>
                    </div>
                  {/if}
                  {#if address}
                    <div class="fact">
                      <dt class="eyebrow">Address</dt>
                      <dd>{address}</dd>
                    </div>
                  {/if}
                  {#if trail.geo}
                    <div class="fact">
                      <dt class="eyebrow">Coordinates</dt>
                      <dd class="mono">{formatCoordinates(trail.geo)}</dd>
                    </div>
                  {/if}
                </dl>
              </div>
            {/if}

            <dl class="facts facts--grid">
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
              {#if trail.acres !== undefined}
                <div class="fact">
                  <dt class="eyebrow">Size</dt>
                  <dd class="mono">{formatAcres(trail.acres)} acres</dd>
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
      {#if trail?.amenities.length}
        <section class="panel amenities">
          <div class="panel__head">
            <span class="eyebrow">What is there</span>
            <span class="eyebrow mono">{trail.amenities.length} recorded</span>
          </div>
          <ul class="panel__body tags">
            {#each trail.amenities as amenity (amenity)}
              <li><span class="tag">{amenity}</span></li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if trail && recorded === 0}
        <div class="panel empty">
          <div class="panel__head">
            <span class="eyebrow">What we know</span>
            <span class="eyebrow eyebrow--accent mono">0 of 3</span>
          </div>
          <div class="panel__body">
            <p>
              Nobody has walked {page.title} and written it up, and there is no
              list of what is there. What this page can tell you honestly is where
              it is. The rest is waiting on a visit.
            </p>
          </div>
        </div>
      {/if}

      <div class="prose">{@html page.html}</div>

      {#if page.children.length}
        <nav class="sub" aria-label="More about {page.title}">
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
</article>

<style>
  .trail {
    container: trail / inline-size;
  }

  .layout {
    display: grid;
    gap: var(--space-24);
  }

  .head,
  .body {
    min-width: 0;
  }

  .rail {
    display: grid;
    align-items: start;
  }

  /* Same rail breakpoint as the Park page (ParkSingle.svelte): a line of
     prose at --measure, the gap, and a 21em rail. */
  @container trail (inline-size >= 68rem) {
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
      align-self: start;
      position: sticky;
      top: var(--space-24);
      max-block-size: calc(100dvh - 2 * var(--space-24));
      overflow-y: auto;
    }
  }

  .empty,
  .amenities {
    max-width: var(--measure);
    margin-bottom: var(--space-24);
  }

  .place--map {
    display: grid;
    grid-template-columns: 8em minmax(0, 1fr);
    align-items: center;
    gap: var(--space-20);
  }

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
</style>
