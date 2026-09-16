<script lang="ts">
  import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<div class="wrap">
  <Breadcrumbs ancestors={page.ancestors} current={page} />
  <h1>{page.title}</h1>
  <article class="prose" style="margin-top: 1.25rem">
    {@html page.html}
  </article>
</div>
