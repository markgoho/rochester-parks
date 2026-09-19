<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import { longestWord } from '#lib/format.js';
  import type { Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();
</script>

<div class="single">
  <Breadcrumbs ancestors={page.ancestors} current={page} />
  <h1 style:--longest-word={longestWord(page.title)}>{page.title}</h1>
  <article class="prose" style="margin-top: var(--space-20)">
    {@html page.html}
  </article>
</div>

<style>
  /* The page column, which the heading fits its longest word to. */
  .single {
    container-type: inline-size;
  }
</style>
