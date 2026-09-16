<script lang="ts">
  import StatusIcon, {
    type StatusKind,
  } from '$lib/components/StatusIcon.svelte';
  import type { ParkStatus } from '$lib/types';

  let { status, label = true }: { status: ParkStatus; label?: boolean } =
    $props();

  // Written, photographed, amenities. The order matches the key and the counts
  // line on the park list.
  const flags = $derived<{ kind: StatusKind; on: boolean; name: string }[]>([
    { kind: 'written', on: status.written, name: 'written up' },
    { kind: 'photographed', on: status.photographed, name: 'photographed' },
    { kind: 'inventoried', on: status.inventoried, name: 'amenities recorded' },
  ]);

  const summary = $derived(
    flags
      .filter((flag) => flag.on)
      .map((flag) => flag.name)
      .join(', ') || 'nothing recorded yet'
  );
</script>

<span class="flags" role="img" aria-label="Status: {summary}">
  {#each flags as flag (flag.kind)}
    <span class="flag" class:flag--on={flag.on}
      ><StatusIcon kind={flag.kind} /></span
    >
  {/each}
</span>
{#if label}
  <span class="eyebrow">{summary}</span>
{/if}
