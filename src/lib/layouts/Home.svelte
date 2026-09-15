<script lang="ts">
  import CountyMap from '$lib/components/CountyMap.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<h1 class="page-title">{page.title}</h1>
{@html page.html}
<CountyMap />
