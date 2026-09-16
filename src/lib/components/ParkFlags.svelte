<script lang="ts">
  import type { ParkStatus } from '$lib/types';

  let { status, label = true }: { status: ParkStatus; label?: boolean } =
    $props();

  // W, P, A on purpose. The written-amenities-photographed order spells an
  // acronym nobody wants on a park page.
  const flags = $derived([
    { letter: 'W', on: status.written, name: 'written up' },
    { letter: 'P', on: status.photographed, name: 'photographed' },
    { letter: 'A', on: status.inventoried, name: 'amenities recorded' },
  ]);

  const summary = $derived(
    flags
      .filter((flag) => flag.on)
      .map((flag) => flag.name)
      .join(', ') || 'nothing recorded yet'
  );
</script>

<span class="flags" role="img" aria-label="Status: {summary}">
  {#each flags as flag (flag.letter)}
    <span class="flag" class:flag--on={flag.on}>{flag.letter}</span>
  {/each}
</span>
{#if label}
  <span class="eyebrow">{summary}</span>
{/if}
