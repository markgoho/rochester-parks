<script lang="ts">
  // The survey benchmark: the triangle a surveyor sets before measuring.
  let {
    size = 24,
    stroke = 'var(--orange)',
  }: { size?: number; stroke?: string } = $props();
</script>

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  {stroke}
  stroke-width="1.8"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <path d="M12 3 21 19H3L12 3Z" />
  <path d="M12 11v8" stroke-linecap="round" />
</svg>
