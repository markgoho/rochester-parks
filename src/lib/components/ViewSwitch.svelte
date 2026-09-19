<script lang="ts">
  import StatusIcon from '#lib/components/StatusIcon.svelte';
  import Tip from '#lib/components/Tip.svelte';

  /**
   * The two views of a park list, as two icons. Each view is its own static
   * page (ADR-0008), so each icon is a link, and the current one links to its
   * own page, marked `aria-current`. A link cannot open a popover on click,
   * so, unlike ParkFlags, the tooltip takes only `interestfor`: hover, focus
   * and long press show it, and a tap follows the link.
   */
  let {
    cards,
    tableUrl,
    cardsUrl,
  }: { cards: boolean; tableUrl: string; cardsUrl: string } = $props();

  const uid = $props.id();
  const views = $derived([
    {
      kind: 'rows' as const,
      name: 'Show as a list',
      href: tableUrl,
      on: !cards,
    },
    {
      kind: 'cards' as const,
      name: 'Show as cards',
      href: cardsUrl,
      on: cards,
    },
  ]);
</script>

<nav class="flags views" aria-label="View">
  {#each views as view (view.kind)}
    <a
      class="flag"
      class:flag--on={view.on}
      href={view.href}
      aria-label={view.name}
      aria-current={view.on ? 'page' : undefined}
      style="anchor-name: --tip-{uid}-{view.kind}"
      interestfor="tip-{uid}-{view.kind}"><StatusIcon kind={view.kind} /></a
    >
    <Tip id="tip-{uid}-{view.kind}" anchor="--tip-{uid}-{view.kind}"
      >{view.name}</Tip
    >
  {/each}
</nav>

<style>
  /* The switch keeps its place from one view to the other. */
  .views {
    view-transition-name: view-switch;
  }

  .flag {
    text-decoration: none;
  }

  .flag:not(.flag--on):is(:hover, :focus-visible) {
    border-color: var(--ink);
    color: var(--ink);
  }
</style>
