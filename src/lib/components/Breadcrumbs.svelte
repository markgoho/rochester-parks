<script lang="ts">
  import type { PageLink } from '#lib/types.js';

  let { ancestors, current }: { ancestors: PageLink[]; current: PageLink } =
    $props();
</script>

<nav class="breadcrumbs" aria-label="breadcrumbs">
  <ol>
    {#each ancestors as ancestor (ancestor.url)}
      <li>
        <a href={ancestor.url}
          >{ancestor.url === '/' ? 'Home' : ancestor.title}</a
        >
        <span aria-hidden="true">»</span>
      </li>
    {/each}
    <li class="active">
      <a href={current.url} aria-current="location">{current.title}</a>
    </li>
  </ol>
</nav>

<style>
  .breadcrumbs ol {
    display: flex;
    list-style: none;
    gap: var(--space-8);
    padding: 0;
    margin: 0;
  }
</style>
