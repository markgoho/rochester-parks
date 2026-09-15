<script lang="ts">
  let { data }: { data: object } = $props();

  // Escape "<" so content can never close the script tag.
  const json = $derived(JSON.stringify(data).replace(/</g, '\\u003c'));
</script>

{@html `<script type="application/ld+json">${json}</script>`}
