<script lang="ts">
  import type { Page } from '$lib/types';

  let { page }: { page: Page } = $props();
</script>

<div class="content-wrapper list-container">
  {@html page.html}
  <ul>
    {#each page.children as child (child.url)}
      <li>
        <a href={child.url}>{child.title}</a>
      </li>
    {/each}
  </ul>
</div>
