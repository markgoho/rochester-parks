<script lang="ts">
  import { page } from '$app/state';
  import Mark from './Mark.svelte';
  import { SITE_TITLE } from '#lib/site.js';

  const links = [
    { href: '/', label: 'Map' },
    { href: '/find/', label: 'Find' },
    { href: '/monroe-county-parks/', label: 'County' },
    { href: '/town-parks/', label: 'Towns' },
    { href: '/rochester-city-parks/', label: 'City' },
    { href: '/state-parks/', label: 'State' },
    { href: '/trails/', label: 'Trails' },
    { href: '/about/', label: 'About' },
  ];

  const current = $derived(page.url?.pathname ?? '/');
</script>

<a class="wordmark" href="/">
  <Mark size={22} />
  <span>{SITE_TITLE}</span>
</a>

<nav aria-label="Main">
  <ul class="nav">
    {#each links as link (link.href)}
      <li>
        <a
          href={link.href}
          aria-current={current === link.href ? 'page' : undefined}
        >
          {link.label}
        </a>
      </li>
    {/each}
    <!-- The Pagefind script upgrades this into a search button (#318). The
         list item keeps a --tap-target square before that happens, so the
         header does not move when it does. -->
    <li class="search">
      <pagefind-modal-trigger compact hide-shortcut></pagefind-modal-trigger>
    </li>
  </ul>
</nav>
