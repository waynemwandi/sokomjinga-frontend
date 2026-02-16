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

{@render children?.()}
