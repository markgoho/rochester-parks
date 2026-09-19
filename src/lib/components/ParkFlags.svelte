<script lang="ts">
  import StatusIcon from '#lib/components/StatusIcon.svelte';
  import type { StatusKind } from '#lib/icons.js';
  import Tip from '#lib/components/Tip.svelte';
  import type { ParkStatus } from '#lib/types.js';

  let { status }: { status: ParkStatus } = $props();

  // Written, photographed, amenities. The order matches the counts line on the
  // park list. Each flag names both of its states, because "not" does not fit
  // in front of every name.
  const flags = $derived<
    { kind: StatusKind; on: boolean; name: string; off: string }[]
  >([
    {
      kind: 'written',
      on: status.written,
      name: 'written up',
      off: 'not written up',
    },
    {
      kind: 'photographed',
      on: status.photographed,
      name: 'photographed',
      off: 'not photographed',
    },
    {
      kind: 'inventoried',
      on: status.inventoried,
      name: 'amenities recorded',
      off: 'no amenities recorded',
    },
  ]);

  /** One id per use, so each icon can name its own tooltip. */
  const uid = $props.id();
  const say = (flag: { on: boolean; name: string; off: string }) =>
    flag.on ? flag.name : flag.off;
</script>

<!-- Each icon carries its own name in a tooltip, on the list and on the park
     page alike. -->
<span class="flags">
  {#each flags as flag (flag.kind)}
    <button
      type="button"
      class="flag"
      class:flag--on={flag.on}
      style="anchor-name: --tip-{uid}-{flag.kind}"
      aria-label={say(flag)}
      interestfor="tip-{uid}-{flag.kind}"
      popovertarget="tip-{uid}-{flag.kind}"
      ><StatusIcon kind={flag.kind} /></button
    >
    <Tip id="tip-{uid}-{flag.kind}" anchor="--tip-{uid}-{flag.kind}"
      >{say(flag)}</Tip
    >
  {/each}
</span>

<style>
  /* The icon is a button. The shared `.flag` look stays in app.css, so only
     the button defaults come off here. `flag--on` keeps its own fill. */
  button.flag {
    font: inherit;
    padding: 0;
    cursor: pointer;
  }

  button.flag:not(.flag--on) {
    background: none;
  }

  button.flag:hover,
  button.flag:focus-visible {
    border-color: var(--ink);
    color: var(--ink);
  }

  button.flag--on:hover,
  button.flag--on:focus-visible {
    color: var(--paper);
  }
</style>
