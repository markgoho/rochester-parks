<script lang="ts">
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<h1>{page.title}</h1>
<article class="content-wrapper">
  <section>
    {@html page.html}
  </section>
</article>
