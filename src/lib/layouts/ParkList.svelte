<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<Breadcrumbs ancestors={page.ancestors} current={page} />

<nav class="park-list">
  <h2>Explore More About This Park</h2>
  <ul>
    {#each page.children as child (child.url)}
      <li>
        <a href={child.url}>{child.title}</a>
      </li>
    {/each}
  </ul>
</nav>

<article>
  <h1>{page.title}</h1>
  <div>{@html page.html}</div>
</article>
