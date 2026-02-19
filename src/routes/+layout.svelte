<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import favicon from "$lib/assets/favicon2.svg";
  import { House, Search, ChartNoAxesCombined, Menu } from "lucide-svelte";

  let title = "MaoniMarket | Kenya's Largest Prediction Market";
  let { children, data } = $props();
  const isAuthed = $derived(data?.isAuthed ?? false);
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
  <title>{title}</title>

  <!-- Meta Description -->
  <meta
    name="description"
    content="MaoniMarket is Kenya’s real-money sentiment platform. Trade Yes/No markets on politics, sports and major events using M-Pesa."
  />

  <!-- OpenGraph -->
  <meta
    property="og:title"
    content="MaoniMarket – Kenya’s Real-Money Sentiment Market"
  />
  <meta
    property="og:description"
    content="Express views on real-world events through structured Yes/No markets. Powered by M-Pesa."
  />
  <meta property="og:url" content="https://maonimarket.com" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://maonimarket.com/og-banner.png" />

  <!-- Canonical -->
  <link rel="canonical" href="https://maonimarket.com" />
</svelte:head>

<div class="pb-28 md:pb-0">
  {@render children?.()}
</div>

<nav
  class="fixed bottom-0 left-0 right-0 z-40 md:hidden
           border-t border-border bg-background/90 backdrop-blur"
>
  <div class="grid grid-cols-4 h-16 text-xs">
    <!-- Home -->
    <a href="/" class="flex flex-col items-center justify-center gap-1">
      <House class="h-5 w-5" />
      <span>Home</span>
    </a>

    <!-- Search -->
    <a href="/" class="flex flex-col items-center justify-center gap-1">
      <Search class="h-5 w-5" />
      <span>Search</span>
    </a>

    <!-- Portfolio -->
    {#if isAuthed}
      <!-- Portfolio -->
      <a
        href="/portfolio"
        class="flex flex-col items-center justify-center gap-1"
      >
        <ChartNoAxesCombined class="h-5 w-5" />
        <span>Portfolio</span>
      </a>
    {:else}
      <!-- Trending -->
      <a
        href="/?filter=trending"
        class="flex flex-col items-center justify-center gap-1"
      >
        <ChartNoAxesCombined class="h-5 w-5" />
        <span>Trending</span>
      </a>
    {/if}

    <!-- More -->
    <a href="/account" class="flex flex-col items-center justify-center gap-1">
      <Menu class="h-5 w-5" />
      <span>More</span>
    </a>
  </div>
</nav>
