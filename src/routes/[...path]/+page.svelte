<script lang="ts">
  import DefaultList from '$lib/layouts/DefaultList.svelte';
  import DefaultSingle from '$lib/layouts/DefaultSingle.svelte';
  import Home from '$lib/layouts/Home.svelte';
  import ParkList from '$lib/layouts/ParkList.svelte';
  import ParkSingle from '$lib/layouts/ParkSingle.svelte';

  let { data } = $props();

  const layouts = {
    home: Home,
    'default-list': DefaultList,
    'default-single': DefaultSingle,
    'park-list': ParkList,
    'park-single': ParkSingle,
  };

  const Layout = $derived(layouts[data.layout]);
</script>

<Layout page={data} />
