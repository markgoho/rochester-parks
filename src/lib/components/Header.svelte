<script lang="ts">
  import { page } from '$app/state';
  import Mark from './Mark.svelte';
  import { SITE_TITLE } from '$lib/site';

  const links = [
    { href: '/', label: 'Map' },
    { href: '/find/', label: 'Find' },
    { href: '/monroe-county-parks/', label: 'County' },
    { href: '/town-parks/', label: 'Towns' },
    { href: '/rochester-city-parks/', label: 'City' },
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
  </ul>
</nav>
