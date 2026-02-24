<!-- src/routes/+page.svelte -->
<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import { page } from "$app/stores";

  import { Bookmark, Gift } from "lucide-svelte";
  import { goto } from "$app/navigation";

  // Server data
  export let data: {
    isAuthed: boolean;
    markets: any[];
    portfolioLabel?: string | null;
    selectedCategory?: string;
  };
  const normalizeCategory = (v?: string | null) =>
    (v ?? "").trim().toLowerCase();
  let isAuthed = data.isAuthed;
  let portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";

  const categories = [
    "All markets",
    "Politics",
    "Crypto",
    "Finance",
    "Culture",
    "Sports",
    "Tech",
    "Other",
  ];

  // Helpers ------------------------------------------------------------
  const yesOf = (m: any) =>
    m.outcomes?.find((o: any) => /^(yes|true)$/i.test(o.name ?? o.label ?? ""));
  const noOf = (m: any) =>
    m.outcomes?.find((o: any) => /^(no|false)$/i.test(o.name ?? o.label ?? ""));

  const chanceOf = (m: any) => {
    const y = yesOf(m);
    if (typeof y?.price_cents === "number") return Math.round(y.price_cents);
    if (typeof y?.prob === "number") return Math.round(y.prob * 100);
    return null;
  };

  const FALLBACK_CHANCE = 54;
  const GAUGE_LENGTH = 141.37; // approx π * r for r ≈ 45

  const gaugeDashOffset = (p: number | null) => {
    const pct = p ?? FALLBACK_CHANCE;
    const clamped = Math.max(0, Math.min(100, pct));
    return GAUGE_LENGTH * (1 - clamped / 100);
  };

  const gaugeColor = (m: any) => {
    const pct = chanceOf(m) ?? FALLBACK_CHANCE;
    return pct < 50 ? "var(--color-no)" : "var(--color-yes)";
  };

  const volLabel = (m: any) =>
    typeof m.volume_cents === "number"
      ? `${formatVolumeKES(m.volume_cents)} Vol.`
      : "— Vol.";

  const formatVolumeKES = (cents: number) => {
    const kes = cents / 100;

    if (kes < 10_000) {
      return `KES ${new Intl.NumberFormat("en-KE").format(kes)}`;
    }

    if (kes < 1_000_000) {
      const v = kes / 1_000;
      return `KES ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}K`;
    }

    if (kes < 1_000_000_000) {
      const v = kes / 1_000_000;
      return `KES ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}M`;
    }

    const v = kes / 1_000_000_000;
    return `KES ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}B`;
  };

  const statusMeta = (m: any) => {
    const s = (m.status ?? "").toLowerCase();

    if (s === "open") {
      return {
        label: "Open",
        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }

    if (s === "closed") {
      return {
        label: "Closed",
        cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }

    if (s === "settled") {
      return {
        label: "Settled",
        cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    }

    return {
      label: s || "Unknown",
      cls: "bg-muted text-muted-foreground border-border",
    };
  };

  $: activeCategory =
    $page.url.searchParams.get("category")?.trim() || "All markets";

  $: filteredMarkets = (
    activeCategory === "All markets"
      ? [...data.markets]
      : data.markets.filter(
          (m: any) =>
            m.category &&
            normalizeCategory(m.category) === normalizeCategory(activeCategory),
        )
  ).sort((a: any, b: any) => {
    const av = a.volume_cents ?? 0;
    const bv = b.volume_cents ?? 0;
    return (
      (b.status === "open" ? 1 : 0) - (a.status === "open" ? 1 : 0) || bv - av
    );
  });
</script>

<svelte:head>
  <title>MaoniMarket | Kenya’s Real-Money Sentiment Market</title>

  <meta
    name="description"
    content="MaoniMarket is Kenya’s real-money sentiment market. Express views on politics, sports, finance and major events using structured Yes/No markets powered by M-Pesa."
  />

  <meta
    property="og:title"
    content="MaoniMarket – Kenya’s Real-Money Sentiment Market"
  />
  <meta
    property="og:description"
    content="Express views on politics, sports and major events using structured markets powered by M-Pesa."
  />
  <meta property="og:image" content="https://maonimarket.com/og-banner.png" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://maonimarket.com" />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<!-- ===========================
    Header
  =========================== -->
<AppHeader {isAuthed} {portfolioLabel} />

<!-- primary nav row (categories) -->
<div class="border-t border-border/60">
  <div
    class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-none"
  >
    {#each categories as c}
      <button
        class={`shrink-0 rounded-md px-3 py-1.5 text-sm transition
        ${
          activeCategory === c
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
        on:click={() =>
          goto(
            c === "All markets" ? "/" : `/?category=${encodeURIComponent(c)}`,
          )}
      >
        {c}
      </button>
    {/each}
  </div>
</div>

<!-- ===========================
    Grid CONTENT
  =========================== -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  {#if activeCategory !== "All markets" && filteredMarkets.length === 0}
    <div class="mt-10 rounded-xl border border-border/60 bg-card/40 px-6 py-16">
      <div class="flex flex-col items-center justify-center text-center">
        <h2 class="text-xl font-semibold mb-2">
          No markets yet in {activeCategory}
        </h2>

        <p class="text-sm text-muted-foreground max-w-md mb-6">
          We’re still building out this category. Want to suggest a market you’d
          like to see?
        </p>

        <a
          href="https://forms.gle/HEwNNnT6pSWZfaNT6"
          target="_blank"
          rel="noopener noreferrer"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Suggest a market
        </a>
      </div>
    </div>
  {:else}
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {#each filteredMarkets as m}
        <article
          class="group rounded-xl border border-border/70 bg-card/80 shadow-sm
         hover:border-primary/40 transition-all duration-200
         hover:-translate-y-1 hover:shadow-lg"
        >
          <a href={`/market/${encodeURIComponent(m.id)}`} class="block">
            <!-- HEADER -->
            <div
              class="p-4 lg:p-5 flex items-start gap-4 border-b border-border/60"
            >
              <!-- Thumbnail -->
              <div
                class="h-12 w-12 shrink-0 rounded bg-muted/60 overflow-hidden
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

              <!-- Title + meta -->
              <div class="min-w-0 flex-1">
                <div class="relative group">
                  <h3
                    class="text-sm font-semibold leading-snug overflow-hidden"
                    style="
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  "
                  >
                    {m.title}
                  </h3>

                  <!-- Hover reveal -->
                  <div
                    class="pointer-events-none absolute z-20 hidden group-hover:block top-full mt-2 w-[280px] rounded-md bg-background border border-border p-3 text-sm shadow-lg"
                  >
                    {m.title}
                  </div>
                </div>

                <span
                  class={`mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[11px]
                ${statusMeta(m).cls}`}
                >
                  {statusMeta(m).label}
                </span>

                {#if m.category}
                  <span
                    class="ml-1 inline-flex items-center rounded-md border border-border
                         px-2 py-0.5 text-[11px] bg-primary/10 text-primary"
                  >
                    {m.category}
                  </span>
                {/if}
              </div>

              <!-- Gauge -->
              <div class="relative h-12 w-20 shrink-0">
                <svg viewBox="0 0 100 50" class="w-full h-full">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(148,163,184,0.25)"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke-linecap="round"
                    stroke-width="6"
                    style={`stroke: ${gaugeColor(m)};
                          stroke-dasharray: ${GAUGE_LENGTH};
                          stroke-dashoffset: ${gaugeDashOffset(chanceOf(m))};`}
                  />
                </svg>

                <div
                  class="absolute inset-0 flex flex-col items-center
                       justify-center translate-y-[18px]"
                >
                  <div class="text-[14px] font-semibold">
                    {chanceOf(m) ?? FALLBACK_CHANCE}%
                  </div>
                  <span class="text-[11px] text-muted-foreground">chance</span>
                </div>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="px-4 lg:px-5 pt-3 pb-4">
              <div class="grid grid-cols-2 gap-3">
                <button
                  class="btn btn-yes"
                  on:click|preventDefault={() =>
                    goto(`/market/${m.id}?side=yes`)}
                >
                  Yes
                </button>

                <button
                  class="btn btn-no"
                  on:click|preventDefault={() =>
                    goto(`/market/${m.id}?side=no`)}
                >
                  No
                </button>
              </div>
            </div>

            <!-- FOOTER -->
            <div
              class="px-4 lg:px-5 pb-4 pt-3 flex items-center text-xs text-muted-foreground"
            >
              <span class="flex-1">{volLabel(m)}</span>
              <div class="flex items-center gap-2 opacity-70">
                <Gift class="h-4 w-4" />
                <Bookmark class="h-4 w-4" />
              </div>
            </div>
          </a>
        </article>
      {/each}
    </div>
  {/if}
</main>
