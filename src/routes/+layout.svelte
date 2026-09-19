<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import Header from '#lib/components/Header.svelte';
  import JsonLd from '#lib/components/JsonLd.svelte';
  import { SITE_TITLE, absUrl } from '#lib/site.js';
  import archivoBlack from '#lib/fonts/ArchivoBlack-400.woff2?url';
  import publicSans from '#lib/fonts/PublicSans-300_700.woff2?url';

  let { children } = $props();

  // A second ordering of a section holds the same parks as the section, so
  // it points at the section rather than competing with it.
  const canonical = $derived(
    absUrl(page.data.canonical ?? page.data.url ?? '/')
  );
  /**
   * A park page shares its photo. Every other page shares no image: the tag
   * must name an image file, and the site has no general one yet.
   */
  const image = $derived.by(() => {
    const photo: string | undefined = page.data.park?.photo;
    if (!photo) return undefined;
    return /^https?:\/\//.test(photo) ? photo : absUrl(photo);
  });
  const title = $derived(
    page.data.url === '/' ? SITE_TITLE : `${page.data.title} · ${SITE_TITLE}`
  );
</script>

<svelte:head>
  <!-- The two fonts every page shows above the fold. The browser would
       otherwise find them only after it parses the CSS. -->
  <link
    rel="preload"
    href={archivoBlack}
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  <link
    rel="preload"
    href={publicSans}
    as="font"
    type="font/woff2"
    crossorigin="anonymous"
  />
  <title>{title}</title>
  <link rel="canonical" href={canonical} />
  <meta name="description" content={page.data.description} />
  <!-- --ink as hex. A meta tag cannot read a CSS token. -->
  <meta name="theme-color" content="#14291e" />
  <meta property="og:title" content={page.data.title} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonical} />
  {#if image}
    <meta property="og:image" content={image} />
  {/if}
  <meta property="og:description" content={page.data.description} />
</svelte:head>

<a class="visually-hidden" href="#main">Skip to content</a>

<header class="site-header">
  <Header />
</header>

<main class="main" id="main">
  {@render children()}
</main>

<footer class="site-footer">
  <p class="eyebrow" style="margin: 0">
    {SITE_TITLE} · every park in Monroe County, New York
  </p>
</footer>

{#each page.data.jsonLd ?? [] as data, i (i)}
  <JsonLd {data} />
{/each}
