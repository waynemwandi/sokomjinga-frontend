<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon2.svg";

  let title = "SokoMjinga";
  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{title}</title>
</svelte:head>

{@render children?.()}
