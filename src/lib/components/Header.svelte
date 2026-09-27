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

<!-- PROTOTYPE (#298): one search trigger per variant. prototype-search.js
     gives the hidden ones a dead shortcut. -->
<span class="pr-slot" data-pf-variant="B"
  ><pagefind-modal-trigger hide-shortcut compact></pagefind-modal-trigger></span
>

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
    <li class="pr-slot" data-pf-variant="A">
      <pagefind-modal-trigger hide-shortcut compact shortcut="/"></pagefind-modal-trigger>
    </li>
  </ul>
</nav>

<span class="pr-slot" data-pf-variant="C"
  ><pagefind-modal-trigger hide-shortcut compact></pagefind-modal-trigger></span
>
