<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import Header from '#lib/components/Header.svelte';
  import JsonLd from '#lib/components/JsonLd.svelte';
  import {
    PAGEFIND_UI_SRC,
    SITE_TITLE,
    absUrl,
    shareCardSlug,
  } from '#lib/site.js';
  import { SEARCH_RESULT_TEMPLATE } from '#lib/search-template.js';
  import archivoBlack from '#lib/fonts/ArchivoBlack-400.woff2?url';
  import publicSans from '#lib/fonts/PublicSans-300_700.woff2?url';

  let { children } = $props();

  // A second ordering of a section holds the same parks as the section, so
  // it points at the section rather than competing with it.
  const canonical = $derived(
    absUrl(page.data.canonical ?? page.data.url ?? '/')
  );
  /**
   * What a shared link shows (#369): every park and trail has its own
   * generated card, with its photo behind the name when it has one. A
   * section list has one too, and a second ordering of it shares it. Every
   * other page gets the one site card.
   */
  const share = $derived.by(() => {
    const park = page.data.park ?? page.data.trail;
    if (park) {
      const what = page.data.trail
        ? 'a trail'
        : `a park in ${park.section.title}`;
      return {
        url: absUrl(`/og/${shareCardSlug(page.data.url ?? '/')}.png`),
        alt: park.photo
          ? `${page.data.title}, ${what}: a photo on a Rochester Parks card`
          : `${page.data.title}, ${what}: its outline on a Rochester Parks card`,
      };
    }
    if (page.data.shareCard) {
      return {
        url: absUrl(`/og/${page.data.shareCard}.png`),
        alt: `${page.data.title}: a list of parks on a Rochester Parks card`,
      };
    }
    return {
      url: absUrl('/og/site.png'),
      alt: `${SITE_TITLE}: every park in Monroe County, New York`,
    };
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
  <!-- Pagefind's Component UI (#318), loaded by script tag from the bundle
       the build writes to /pagefind/, not by a Vite import. /find hydrates
       (csr = true): if Pagefind renders into its elements before that,
       Svelte finds a mismatch and rebuilds the page, so there it loads
       after hydration instead (see find/+page.svelte). -->
  <link rel="stylesheet" href="/pagefind/pagefind-component-ui.css" />
  <!-- A module for the import of search-log.js (#322); still deferred like
       the plain script it replaces (see search.js for why load order
       against the Pagefind module below does not matter). -->
  <script type="module" src="/search.js"></script>
  {#if page.url.pathname !== '/find/'}
    <script type="module" src={PAGEFIND_UI_SRC}></script>
  {/if}
  <title>{title}</title>
  <link rel="canonical" href={canonical} />
  <meta name="description" content={page.data.description} />
  <!-- --ink as hex. A meta tag cannot read a CSS token. -->
  <meta name="theme-color" content="#14291e" />
  <meta property="og:title" content={page.data.title} />
  <meta property="og:site_name" content={SITE_TITLE} />
  <meta property="og:type" content="article" />
  <meta property="og:url" content={canonical} />
  <meta property="og:image" content={share.url} />
  <meta property="og:image:alt" content={share.alt} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <!-- X and some chat apps read this, not og:*, to pick the card size. Every
       page has a large image now. -->
  <meta name="twitter:card" content="summary_large_image" />
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
    {SITE_TITLE} · every park in Monroe County, New York ·
    <a href="/about/">About</a> ·
    <a href="https://www.openstreetmap.org/copyright"
      >© OpenStreetMap contributors</a
    >
  </p>
</footer>

<!-- The one search dialog for the whole site (#318). Every header trigger
     opens this. reset-on-close: the dialog is empty the next time it opens. -->
<pagefind-modal reset-on-close>
  <pagefind-modal-header>
    <pagefind-input placeholder="Search parks, trails and posts"
    ></pagefind-input>
  </pagefind-modal-header>
  <pagefind-modal-body>
    <pagefind-summary></pagefind-summary>
    <!-- The custom result template (#320): the name, the second line, then
         the excerpt, with no sub-results (a Park's own topics never show as
         their own rows). -->
    <pagefind-results hide-sub-results
      >{@html SEARCH_RESULT_TEMPLATE}</pagefind-results
    >
  </pagefind-modal-body>
  <pagefind-modal-footer>
    <pagefind-keyboard-hints></pagefind-keyboard-hints>
  </pagefind-modal-footer>
</pagefind-modal>

{#each page.data.jsonLd ?? [] as data, i (i)}
  <JsonLd {data} />
{/each}
