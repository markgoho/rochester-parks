<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<div class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />
  <h1>{page.title}</h1>
  {#if page.html}
    <div class="prose" style="margin-top: 1.25rem">{@html page.html}</div>
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
    margin: 1.75rem 0 0;
    padding: 0;
    list-style: none;
    border-top: 2px solid var(--ink);
  }

  .section-list a {
    display: flex;
    align-items: center;
    min-height: 3.25rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--rule-soft);
    font-size: 1.0625rem;
    font-weight: 700;
  }
</style>
