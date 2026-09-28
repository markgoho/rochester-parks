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
  ];

  const current = $derived(page.url?.pathname ?? '/');
</script>

<a class="wordmark" href="/">
  <Mark size={22} />
  <span>{SITE_TITLE}</span>
</a>

<nav aria-label="Main">
  <!-- On narrow screens the links do not fit beside the wordmark, so they
       open from this button as a popover. The browser handles the toggle,
       Escape, a click outside and aria-expanded; no script. From 60rem the
       CSS hides the button and shows the list in the header. -->
  <button class="menu-button" type="button" popovertarget="main-menu">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path class="open" d="M4 7h16M4 12h16M4 17h16" />
      <path class="close" d="M6 6l12 12M18 6 6 18" />
    </svg>
    <span class="visually-hidden">Menu</span>
  </button>
  <ul class="nav" id="main-menu" popover>
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

<!-- The Pagefind script upgrades this into a search button (#318). The slot
     keeps a --tap-target square before that happens, so the header does not
     move when it does. It sits outside the menu, so search is one tap on
     every screen. -->
<div class="search">
  <pagefind-modal-trigger compact hide-shortcut></pagefind-modal-trigger>
</div>
