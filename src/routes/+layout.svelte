<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import Header from '$lib/components/Header.svelte';
  import JsonLd from '$lib/components/JsonLd.svelte';
  import { absUrl } from '$lib/site';

  let { children } = $props();

  const canonical = $derived(absUrl(page.data.url ?? '/'));
</script>

<svelte:head>
  <title>{page.data.title}</title>
  <link rel="canonical" href={canonical} />
  <meta name="description" content={page.data.description} />
  <meta property="og:title" content={page.data.title} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={absUrl('/')} />
  <meta property="og:description" content={page.data.description} />
  <meta name="view-transition" content="same-origin" />
</svelte:head>

<header class="header">
  <Header />
</header>

<main class="main">
  {@render children()}
</main>

<footer class="footer"></footer>

{#each page.data.jsonLd ?? [] as data, i (i)}
  <JsonLd {data} />
{/each}
