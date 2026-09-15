<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<Breadcrumbs ancestors={page.ancestors} current={page} />

<article>
  <h1>{page.title}</h1>
  <div>{@html page.html}</div>
</article>
