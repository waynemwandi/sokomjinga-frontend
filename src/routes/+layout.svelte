<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import "../app.css";
  import { House, Search, ChartNoAxesCombined, Menu } from "lucide-svelte";
  import { tick } from "svelte";

  import { searchQuery } from "$lib/stores/search";
  import { searchResults } from "$lib/stores/search";
  import { portfolio } from "$lib/stores/portfolio";

  let title = "MaoniMarket | Kenya's Largest Prediction Market";
  let { children, data } = $props();
  const isAuthed = $derived(data?.isAuthed ?? false);

  let showMobileSearch = $state(false);
  let mobileQuery = $state("");
  $effect(() => {
    searchQuery.set(mobileQuery);
  });
  $effect(() => {
    $page.url; // react to navigation

    showMobileSearch = false;
    mobileQuery = "";
  });
  $effect(() => {
    const raw = data?.portfolioLabel;
    if (!raw) return;

    const cleaned = String(raw)
      .replace("Portfolio ", "")
      .replace(/KES\s?/i, "")
      .replace(/,/g, "")
      .trim();

    const value = Number(cleaned);

    if (!Number.isNaN(value) && $portfolio === 0) {
      portfolio.set(value);
    }
  });

  // let mobileSearchInput = $state<HTMLInputElement | null>(null);
  let mobileSearchInput = $state<HTMLInputElement | null>(null);
</script>

<svelte:head>
  <title>{title}</title>

  <!-- Meta Description -->
  <meta
    name="description"
    content="MaoniMarket is Kenya’s Largest Prediction Market. Trade Yes/No markets on politics, sports and major events using M-Pesa."
  />

  <!-- OpenGraph -->
  <meta
    property="og:title"
    content="MaoniMarket – Kenya’s Largest Prediction Market"
  />
  <meta
    property="og:description"
    content="Trade Yes/No markets on politics, sports and major events using structured markets powered by M-Pesa."
  />
  <meta property="og:url" content="https://maonimarket.com" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://maonimarket.com/og-banner.png" />

  <!-- Canonical -->
  <link rel="canonical" href="https://maonimarket.com" />
</svelte:head>

<div class="pb-36 md:pb-0">{@render children?.()}</div>

{#if showMobileSearch}
  <div
    class="fixed inset-0 z-50 bg-background/80 backdrop-blur flex flex-col p-4"
  >
    <!-- Search Bar -->
    <div class="flex gap-2 mb-4">
      <input
        bind:this={mobileSearchInput}
        bind:value={mobileQuery}
        class="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm"
        placeholder="Search markets"
      />

      <button
        class="text-sm border border-border bg-card px-3 py-2 rounded"
        onclick={() => {
          mobileQuery = "";
          showMobileSearch = false;
        }}
      >
        Cancel
      </button>
    </div>

    <!-- Results -->
    <div
      class="flex-1 overflow-y-auto rounded-xl border border-border bg-card/80 divide-y divide-border"
    >
      {#if mobileQuery.trim() === ""}
        <div class="p-6 text-sm text-muted-foreground text-center">
          Start typing to search
        </div>
      {:else if $searchResults.length === 0}
        <div class="p-6 text-sm text-muted-foreground text-center">
          No markets found
        </div>
      {:else}
        {#each $searchResults.slice(0, 10) as m}
          <a
            href={`/market/${m.id}`}
            class="flex items-center justify-between p-4 hover:bg-accent transition"
          >
            <div class="flex items-center gap-3 flex-1">
              <div
                class="h-10 w-10 rounded bg-muted overflow-hidden
                      flex items-center justify-center text-xs"
              >
                {#if m.image_url}
                  <img
                    src={m.image_url}
                    alt={m.title ?? ""}
                    class="h-full w-full object-cover"
                  />
                {:else}
                  {m.title?.slice(0, 2)?.toUpperCase() ?? "MK"}
                {/if}
              </div>

              <div class="text-sm font-medium line-clamp-2">
                {m.title}
              </div>
            </div>

            <div class="text-sm font-semibold">
              {m.outcomes?.[0]?.price_cents ?? 50}%
            </div>
          </a>
        {/each}
      {/if}
    </div>
  </div>
{/if}

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
    <button
      class="flex flex-col items-center justify-center gap-1"
      onclick={async () => {
        showMobileSearch = true;
        await tick();
        mobileSearchInput?.focus();
      }}
    >
      <Search class="h-5 w-5" />
      <span>Search</span>
    </button>

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
