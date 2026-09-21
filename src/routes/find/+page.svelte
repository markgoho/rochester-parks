<script lang="ts">
  import type { ParkIndexEntry } from '#lib/types.js';

  let { data } = $props();

  let selected = $state<string[]>([]);
  let scope = $state('all');

  const toggle = (name: string) => {
    selected = selected.includes(name)
      ? selected.filter((item) => item !== name)
      : [...selected, name];
  };

  const scoped = $derived(
    scope === 'all'
      ? data.parks
      : data.parks.filter((park) => park.sectionUrl === scope)
  );
  const inventoried = $derived(
    scoped.filter((park) => park.amenities.length > 0)
  );
  const unrecorded = $derived(
    scoped.filter((park) => park.amenities.length === 0)
  );

  const has = (park: ParkIndexEntry, name: string) =>
    park.amenities.includes(name);
  const matched = $derived(
    inventoried.filter((park) => selected.every((name) => has(park, name)))
  );
  const fellShort = $derived(
    inventoried
      .filter((park) => !selected.every((name) => has(park, name)))
      .map((park) => ({
        park,
        missing: selected.filter((name) => !has(park, name)),
      }))
  );

  const scopeName = $derived(
    scope === 'all'
      ? 'Monroe County'
      : (data.sections.find((section) => section.url === scope)?.title ?? '')
  );
  const coverage = $derived(
    scoped.length ? Math.round((inventoried.length / scoped.length) * 100) : 0
  );
  const phrase = $derived(
    selected.length
      ? new Intl.ListFormat('en', {
          style: 'long',
          type: 'conjunction',
        }).format(selected.map((name) => name.toLowerCase()))
      : 'an amenity list'
  );
</script>

<header class="head">
  <p class="eyebrow rule-in">Find a park</p>
  <h1>What has to be there?</h1>
  <p class="lede measure">
    Pick the things you cannot do without. We will show you where somebody has
    confirmed them, which parks fall short and exactly why, and which ones
    nobody has looked at yet.
  </p>
</header>

<section class="panel filters">
  <div class="panel__head">
    <span class="eyebrow">
      Must have{selected.length ? ` · ${selected.length} selected` : ''}
    </span>
    {#if selected.length}
      <button
        class="clear eyebrow"
        type="button"
        onclick={() => (selected = [])}
      >
        Clear
      </button>
    {/if}
  </div>

  <div class="panel__body">
    <ul class="tags">
      {#each data.amenities as amenity (amenity.name)}
        <li>
          <button
            type="button"
            class="tag"
            class:tag--on={selected.includes(amenity.name)}
            aria-pressed={selected.includes(amenity.name)}
            onclick={() => toggle(amenity.name)}
          >
            {amenity.name} <span class="count">{amenity.count}</span>
          </button>
        </li>
      {/each}
    </ul>

    <p class="scope">
      <label class="eyebrow" for="scope">Within</label>
      <select id="scope" bind:value={scope}>
        <option value="all"
          >Anywhere in Monroe County ({data.parks.length})</option
        >
        {#each data.sections as section (section.url)}
          <option value={section.url}>{section.title} ({section.count})</option>
        {/each}
      </select>
    </p>
  </div>
</section>

<!-- The frame is the container .summary queries below. A container cannot
     query itself. -->
<div class="summary-frame">
<div class="summary">
  <p class="count-out">
    <span class="mono">{matched.length}</span>
    <span>
      {matched.length === 1 ? 'park' : 'parks'} in {scopeName}
      {selected.length ? 'have' : 'has'}
      {phrase}
    </span>
  </p>

  <div class="panel coverage">
    <div class="panel__body">
      <p class="coverage__head">
        <span class="eyebrow">How much of {scopeName} this can see</span>
        <span class="mono">{inventoried.length} / {scoped.length}</span>
      </p>
      <p class="meter" aria-hidden="true">
        <span class="meter__fill" style="width: {coverage}%"></span>
        <span style="width: {100 - coverage}%"></span>
      </p>
      <p class="coverage__note">
        {unrecorded.length} of these parks have no amenity list. They are not missing
        a shelter — nobody has written down whether they have one.
      </p>
    </div>
  </div>
</div>
</div>

<section class="results" aria-live="polite">
  <h2 class="group">
    {matched.length}
    {matched.length === 1 ? 'park matches' : 'parks match'}
  </h2>
  {#if matched.length}
    <ul class="rows">
      {#each matched as park (park.url)}
        <li class="row">
          <a class="row__name" href={park.url}>{park.title}</a>
          <span class="eyebrow row__section">{park.section}</span>
          <span class="tags row__tags">
            {#each park.amenities as amenity (amenity)}
              <span class="tag" class:tag--on={selected.includes(amenity)}
                >{amenity}</span
              >
            {/each}
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="none">
      Nothing recorded in {scopeName} has all of that. Try removing one.
    </p>
  {/if}

  {#if selected.length && fellShort.length}
    <h2 class="group group--quiet">{fellShort.length} fall short</h2>
    <p class="eyebrow group__note">We know what is there — and what is not</p>
    <ul class="rows">
      {#each fellShort as { park, missing } (park.url)}
        <li class="row row--quiet">
          <a class="row__name" href={park.url}>{park.title}</a>
          <span class="eyebrow row__section">{park.section}</span>
          <span class="tags row__tags">
            {#each missing as name (name)}
              <span class="tag tag--off">no {name.toLowerCase()}</span>
            {/each}
          </span>
        </li>
      {/each}
    </ul>
  {/if}

  {#if unrecorded.length}
    <section class="panel unreachable">
      <div class="panel__head">
        <span class="eyebrow">{unrecorded.length} the filter cannot reach</span>
        <span class="eyebrow eyebrow--accent">No amenity list recorded</span>
      </div>
      <div class="panel__body">
        <ul class="unreachable__list">
          {#each unrecorded as park (park.url)}
            <li><a href={park.url}>{park.title}</a></li>
          {/each}
        </ul>
        <p class="coverage__note">
          Listing them is the point. A park absent from a result reads as a park
          that failed the test, and none of these did.
        </p>
      </div>
    </section>
  {/if}
</section>

<style>
  .head {
    display: flex;
    flex-direction: column;
    gap: var(--space-14);
    padding: var(--space-24) 0 var(--space-28);
  }

  .lede {
    margin: 0;
    font-size: var(--step-1);
    color: var(--ink-soft);
  }

  .filters .tags {
    gap: var(--space-8);
  }

  .tag {
    cursor: pointer;
    min-height: var(--tap-target);
    font: inherit;
    font-family: var(--mono);
    font-size: var(--step--2);
    letter-spacing: var(--tracking-snug);
    text-transform: uppercase;
  }

  .clear {
    padding: 0;
    border: 0;
    background: none;
    color: var(--orange-ink);
    cursor: pointer;
    font-family: var(--mono);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
  }

  .scope {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-12);
    margin: var(--space-20) 0 0;
    padding-top: var(--space-16);
    border-top: var(--line-hair) solid var(--rule-soft);
  }

  /* The longest place name is wider than a phone, so the box stays in the
     column and the name is cut short. */
  select {
    max-width: 100%;
    min-height: var(--tap-target);
    padding: 0 var(--space-12);
    border: var(--line-hair) solid var(--rule-strong);
    background: var(--card);
    color: var(--ink);
    font: inherit;
    font-size: var(--step-0);
  }

  .summary {
    display: grid;
    gap: var(--space-16);
    /* No bottom margin: the results open with a .group heading, and its top
       margin is the space. Margins in the page grid do not collapse. */
    margin: var(--space-20) 0 0;
  }

  .count-out {
    display: flex;
    align-items: baseline;
    gap: var(--space-16);
    margin: 0;
    padding: var(--space-20) var(--space-24);
    background: var(--orange);
    color: var(--paper);
    font-size: var(--step-0);
    font-weight: var(--weight-bold);
  }

  .count-out .mono {
    font-size: var(--step-5);
    font-weight: var(--weight-bold);
    line-height: var(--leading-none);
  }

  .coverage__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-16);
    margin: 0;
  }

  .coverage__head .mono {
    font-size: var(--step--1);
  }

  .coverage__note {
    margin: 0;
    font-size: var(--step-0);
    color: var(--ink-soft);
  }

  /* Named "results": the container .row queries below, the space .row
     actually gets. */
  .results {
    container: results / inline-size;
  }

  .summary-frame {
    container: summary / inline-size;
  }

  .group {
    margin: var(--space-32) 0 var(--space-12);
    padding-bottom: var(--space-12);
    border-bottom: var(--line-heavy) solid var(--ink);
  }

  .group--quiet {
    color: var(--ink-muted);
    border-bottom-width: var(--line-hair);
    border-bottom-color: var(--rule);
  }

  .group__note {
    margin: calc(-1 * var(--space-4)) 0 var(--space-12);
  }

  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .row {
    display: grid;
    gap: var(--space-6);
    padding: var(--space-14) var(--space-16);
    border: var(--line-hair) solid var(--ink);
    background: var(--card);
    margin-bottom: var(--space-10);
  }

  .row--quiet {
    border: 0;
    border-bottom: var(--line-hair) solid var(--rule-soft);
    background: none;
    margin-bottom: 0;
    padding-inline: 0;
  }

  .row__name {
    font-size: var(--step-1);
    font-weight: var(--weight-bold);
  }

  .none {
    margin: 0;
    color: var(--ink-soft);
  }

  .unreachable {
    margin-top: var(--space-32);
    background: var(--paper-sunk);
  }

  .unreachable__list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
    gap: 0 var(--space-24);
    margin: 0 0 var(--space-12);
    padding: 0;
    list-style: none;
  }

  .unreachable__list a {
    display: flex;
    align-items: center;
    min-height: var(--tap-target);
    color: var(--ink-soft);
  }

  /* 20rem text + 30rem coverage panel + 1rem gap = 51rem. */
  @container summary (inline-size >= 51rem) {
    .summary {
      grid-template-columns: minmax(20rem, 1fr) 30rem;
      align-items: stretch;
    }
  }

  /* .row sits inside .results, its nearer "results" container: 10rem name +
     8rem section + 10rem tags + 2 * 1.25rem gap = 30.5rem. */
  @container results (inline-size >= 30.5rem) {
    .row {
      grid-template-columns: minmax(10rem, 16rem) 8rem minmax(10rem, 1fr);
      align-items: center;
      gap: var(--space-20);
    }
  }
</style>
