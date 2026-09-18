<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import CountyMap from '#lib/components/CountyMap.svelte';
  import { MUNICIPALITIES } from '#lib/municipalities.js';
  import type { Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  /** A list of towns gets the county map beside it. */
  const mapped = $derived(
    page.children.some((child) =>
      MUNICIPALITIES.some((m) => m.href === child.url)
    )
  );
</script>

<div class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />
  <h1>{page.title}</h1>
  {#if page.html}
    <div class="prose" style="margin-top: var(--space-20)">
      {@html page.html}
    </div>
  {/if}

  {#if page.children.length}
    <div class="section-body" class:mapped>
      <ul class="section-list">
        {#each page.children as child (child.url)}
          <li>
            <a href={child.url}>{child.title}</a>
          </li>
        {/each}
      </ul>

      {#if mapped}
        <div class="section-map">
          <!-- A town name in the list picks its town on the map. -->
          <CountyMap scope=".section-body" />
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .section-body {
    display: grid;
    gap: var(--space-40);
    margin-top: var(--space-28);
  }

  .section-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0;
    align-content: start;
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: var(--line-heavy) solid var(--ink);
  }

  .section-list a {
    display: flex;
    align-items: center;
    min-height: 3.25rem;
    padding: var(--space-8) 0;
    border-bottom: var(--line-hair) solid var(--rule-soft);
    font-size: var(--text-lg);
    font-weight: var(--weight-bold);
  }

  /* A town on the county's north edge grows past the top of the map, so the
     map stands back far enough to keep it clear of the list. */
  .section-map {
    padding-top: var(--space-28);
  }

  @media (min-width: 60rem) {
    .mapped {
      grid-template-columns: minmax(0, 1fr) 34rem;
      align-items: start;
      gap: var(--space-56);
    }

    /* The map stays in view while the list scrolls past it. */
    .section-map {
      position: sticky;
      top: var(--space-28);
    }
  }

  @media (min-width: 80rem) {
    .mapped {
      grid-template-columns: minmax(0, 1fr) 44rem;
    }
  }
</style>
