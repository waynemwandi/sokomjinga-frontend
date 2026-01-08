<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon2.svg";

  let title = "MaoniMarket | Kenya's Largest Prediction Market";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{title}</title>
</svelte:head>

{@render children?.()}
