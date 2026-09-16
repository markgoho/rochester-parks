<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
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
    <ul class="section-list">
      {#each page.children as child (child.url)}
        <li>
          <a href={child.url}>{child.title}</a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .section-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
    gap: 0;
    margin: var(--space-28) 0 0;
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
</style>
