<script lang="ts">
  import type { Snippet } from 'svelte';

  /**
   * A tooltip for one trigger. The trigger is the caller's own button, which
   * sets `anchor-name: {anchor}`, `interestfor={id}` and `popovertarget={id}`.
   * `interestfor` reveals the tip on hover, focus and long press;
   * `popovertarget` is the click and tap path every current browser already
   * has. Both are declarative, so the tooltip works with no client
   * JavaScript. The popover is an auto popover, not a hint: a browser that
   * does not know `hint` falls back to a manual popover, which never
   * light-dismisses.
   */
  let {
    id,
    anchor,
    children,
  }: { id: string; anchor: string; children: Snippet } = $props();
</script>

<span popover {id} class="tip eyebrow" style="position-anchor: {anchor}"
  >{@render children()}</span
>

<style>
  .tip {
    padding: var(--space-6) var(--space-10);
    border: var(--line-hair) solid var(--ink);
    background: var(--ink);
    color: var(--paper);
    letter-spacing: var(--tracking-wide);
    white-space: nowrap;
  }

  /* Anchor positioning is not everywhere yet, and the browser centres a
     popover with `margin: auto`. Only a browser that can tie the tooltip to
     its trigger gets to drop that centring. The tooltip sits above its
     trigger, because the pointer covers the space below it. */
  @supports (position-area: block-start center) {
    .tip {
      margin: var(--space-6) 0;
      position-area: block-start center;
      position-try-fallbacks: flip-block;
    }
  }
</style>
