<script lang="ts">
  import Breadcrumbs from '#lib/components/Breadcrumbs.svelte';
  import CommentArea from '#lib/components/CommentArea.svelte';
  import { longestWord } from '#lib/format.js';
  import { searchEntryOf } from '#lib/search-index.js';
  import type { Page } from '#lib/types.js';

  let { page }: { page: Page } = $props();

  /**
   * Whether this page belongs in the Pagefind index, and what a result shows
   * for it (#320): a Blog post, About, or a "Trails" sub-page of a Park.
   */
  const search = $derived(searchEntryOf(page));
</script>

<div class="single" data-pagefind-body={search.indexed ? '' : undefined}>
  {#if search.indexed}
    {#if page.trailsOf}
      <!-- "Trails" titles itself, so the result needs an explicit override
           to read "Trails, <Park>" (#320). -->
      <span hidden data-pagefind-ignore data-pagefind-meta="title"
        >{search.title}</span
      >
    {/if}
    {#if search.line}
      <span hidden data-pagefind-ignore data-pagefind-meta="line"
        >{search.line}</span
      >
    {/if}
    {#if search.place}
      <!-- Ordinary indexed text, not ignored, so "Henrietta" still finds a
           Park's own "Trails" sub-page (#297). -->
      <span hidden>{search.place}</span>
    {/if}
    {#if search.photo}
      <!-- The result's photo (#341): the Park's own, as its card shows. -->
      <span hidden data-pagefind-ignore data-pagefind-meta="photo"
        >{search.photo}</span
      >
    {/if}
    {#if search.map}
      <!-- With no photo, the result's picture (#341): the Park's outline,
           else its place map, served as this page's `map.svg`.
           Only a flag here, since Pagefind indexes every meta value (#333). -->
      <span hidden data-pagefind-meta="map:1"></span>
    {/if}
  {/if}
  <Breadcrumbs ancestors={page.ancestors} current={page} />
  <h1 style:--longest-word={longestWord(page.title)}>{page.title}</h1>
  <article class="prose" style="margin-top: var(--space-20)">
    {@html page.html}
  </article>
  <!-- Only a Blog post carries `commentArea`; About shares this layout. -->
  {#if page.commentArea}<CommentArea area={page.commentArea} />{/if}
</div>

<style>
  /* The page column, which the heading fits its longest word to. */
  .single {
    container-type: inline-size;
  }
</style>
