<!-- src/routes/+page.svelte -->
<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import HowItWorksModal from "$lib/components/layout/HowItWorksModal.svelte";
  import { page } from "$app/stores";
  import { onMount, onDestroy } from "svelte";
  import { Bookmark, ChartNoAxesCombined, Gift } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { searchQuery, searchResults } from "$lib/stores/search";
  import { PUBLIC_API_BASE } from "$env/static/public";

  // Server data
  let { data } = $props<{
    data: {
      isAuthed: boolean;
      markets: any[];
      portfolioLabel?: string | null;
      selectedCategory?: string;
    };
  }>();
  const normalizeCategory = (v?: string | null) =>
    (v ?? "").trim().toLowerCase();
  let isAuthed = data.isAuthed;
  let portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";
  let markets = $state(data.markets);
  let showHowItWorks = $state(false);

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

  let pollingInterval: ReturnType<typeof setInterval>;

  const fetchMarkets = async () => {
    if (typeof window === "undefined") return;

    try {
      const res = await fetch(`${PUBLIC_API_BASE}/markets`, {
        headers: { accept: "application/json" },
      });

      if (!res.ok) return;

      const updated = await res.json();

      if (!Array.isArray(updated)) return;

      // Normalize same as server
      const normalized = updated.map((m) => ({
        ...m,
        image_url: m.image_url ?? m.img ?? null,
        volume_cents: m.volume_cents ?? 0,
      }));

      if (JSON.stringify(markets) !== JSON.stringify(normalized)) {
        markets = normalized;
      }
    } catch (err) {
      console.error("Polling failed:", err);
    }
  };

  onMount(() => {
    fetchMarkets();

    pollingInterval = setInterval(() => {
      fetchMarkets();
    }, 3000);
  });

  onDestroy(() => {
    if (pollingInterval) clearInterval(pollingInterval);
  });

  let activeCategory = $derived(
    $page.url.searchParams.get("category")?.trim() || "All markets",
  );

  let filteredMarkets = $derived(
    (() => {
      const categoryFiltered =
        activeCategory === "All markets"
          ? [...markets]
          : markets.filter(
              (m: any) =>
                m.category &&
                normalizeCategory(m.category) ===
                  normalizeCategory(activeCategory),
            );

      const q = $searchQuery?.trim().toLowerCase();

      const searchFiltered = q
        ? categoryFiltered.filter((m: any) =>
            m.title?.toLowerCase().includes(q),
          )
        : categoryFiltered;

      const statusRank = (s: string) =>
        s === "open" ? 0 : s === "closed" ? 1 : s === "settled" ? 2 : 3;

      return searchFiltered.sort(
        (a: any, b: any) =>
          statusRank(a.status) - statusRank(b.status) ||
          (b.volume_cents ?? 0) - (a.volume_cents ?? 0),
      );
    })(),
  );

  function closesInLabel(m: any): string | null {
    const date = m.close_at ?? m.projected_end_date;
    if (!date) return null;

    // only for open markets
    if ((m.status ?? "").toLowerCase() !== "open") return null;

    const closeTime = new Date(date).getTime();
    const now = Date.now();
    const diff = closeTime - now;

    // hide past
    if (diff <= 0) return null;

    // only show within 24h
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (diff > ONE_DAY) return null;

    const totalMinutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) return `Closes in ${minutes}m`;

    return `Closes in ${hours}h ${minutes}m`;
  }

  function isClosingSoon(m: any): boolean {
    const date = m.close_at ?? m.projected_end_date;
    if (!date) return false;

    if ((m.status ?? "").toLowerCase() !== "open") return false;

    const diff = new Date(date).getTime() - Date.now();

    const ONE_DAY = 24 * 60 * 60 * 1000;

    return diff > 0 && diff <= ONE_DAY;
  }

  let now = $state(Date.now());

  onMount(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 60000); // update every minute (lightweight)

    return () => clearInterval(interval);
  });

  $effect(() => {
    searchResults.set(filteredMarkets);
  });

  let visibleCount = $state(8);
  const LOAD_STEP = 8;
  let visibleMarkets = $derived(filteredMarkets.slice(0, visibleCount));
</script>

<svelte:head>
  <title>MaoniMarket | Kenya’s Largest Prediction Market</title>

  <meta
    name="description"
    content="MaoniMarket is Kenya’s largest prediction market. Trade Yes/No markets on politics, sports and major events using M-Pesa."
  />

  <meta
    property="og:title"
    content="MaoniMarket – Kenya’s Largest Prediction Market"
  />
  <meta
    property="og:description"
    content="Trade Yes/No markets on politics, sports and major events using structured markets powered by M-Pesa."
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
    class="home-category-bar mx-auto w-full max-w-[1400px] px-4 md:px-6"
  >
    {#each categories as c}
      <button
        class={`home-category-tab
        ${
          activeCategory === c
            ? "home-category-tab-active"
            : "home-category-tab-idle"
        }`}
        onclick={() =>
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
  {#if $searchQuery?.trim()}
    <div class="mb-4 text-xs text-muted-foreground">
      {filteredMarkets.length} result{filteredMarkets.length === 1 ? "" : "s"}
    </div>
  {/if}
  {#if activeCategory !== "All markets" && filteredMarkets.length === 0}
    <div class="empty-market-state">
      <div class="flex flex-col items-center justify-center text-center">
        <h2 class="text-xl font-semibold tracking-tight mb-2">
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
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5"
    >
      {#each visibleMarkets as m (m.id)}
        <article
          class={`market-card group
            ${
              isClosingSoon(m)
                ? "market-card-alert"
                : ""
            }`}
        >
          <a
            href={`/market/${encodeURIComponent(m.id)}`}
            class="market-card-link"
          >
            <!-- HEADER -->
            <div class="market-card-header">
              <!-- Thumbnail -->
              <div class="market-thumb">
                {#if m.image_url}
                  <img
                    src={m.image_url}
                    alt={m.title ?? ""}
                    class="h-full w-full object-cover"
                  />
                {:else}
                  <span class="market-thumb-fallback">
                    {m.title?.slice(0, 2)?.toUpperCase() ?? "MK"}
                  </span>
                {/if}
              </div>

              <!-- Title + meta -->
              <div class="min-w-0 flex-1">
                <h3 class="market-title">
                  {m.title}
                </h3>

                <div class="market-chip-row">
                  <span class={`market-chip ${statusMeta(m).cls}`}>
                    {statusMeta(m).label}
                  </span>

                  {#if m.category}
                    <span class="market-chip market-chip-category">
                      {m.category}
                    </span>
                  {/if}
                </div>
              </div>

              <!-- Gauge -->
              <div class="market-gauge">
                <svg viewBox="0 0 100 50" class="w-full h-full">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    class="market-gauge-track"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke-linecap="round"
                    stroke-width="6"
                    class="market-gauge-fill"
                    style={`stroke: ${gaugeColor(m)};
                          stroke-dasharray: ${GAUGE_LENGTH};
                          stroke-dashoffset: ${gaugeDashOffset(chanceOf(m))};`}
                  />
                </svg>

                <div class="market-gauge-label">
                  <div class="market-gauge-value">
                    {chanceOf(m) ?? FALLBACK_CHANCE}%
                  </div>
                  <span class="market-gauge-caption">chance</span>
                </div>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="market-actions">
              <div class="grid grid-cols-2 gap-3">
                <button
                  class="btn btn-yes"
                  onclick={(e) => {
                    e.preventDefault();
                    goto(`/market/${m.id}?side=yes`);
                  }}
                >
                  Yes
                </button>

                <button
                  class="btn btn-no"
                  onclick={(e) => {
                    e.preventDefault();
                    goto(`/market/${m.id}?side=no`);
                  }}
                >
                  No
                </button>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="market-footer">
              <div class="flex items-center">
                <span class="flex-1 font-semibold text-foreground/85">
                  {volLabel(m)}
                </span>

                <div class="market-footer-icons">
                  <Gift class="h-4 w-4" />
                  <Bookmark class="h-4 w-4" />
                </div>
              </div>

              {#if closesInLabel(m)}
                <div class="mt-1 text-[11px] text-amber-400">
                  {closesInLabel(m)}
                </div>
              {/if}
            </div>
          </a>
        </article>
      {/each}
    </div>

    {#if visibleCount < filteredMarkets.length}
      <div class="mt-8 flex justify-center">
        <button
          class="rounded-md border border-border bg-input px-4 py-2 text-sm hover:bg-card transition"
          onclick={() => (visibleCount += LOAD_STEP)}
        >
          See more
        </button>
      </div>
    {/if}
  {/if}
</main>

<footer class="border-t border-border/60 mt-16">
  <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-10">
    <!-- Top Row -->
    <div
      class="flex flex-col md:flex-row md:items-start md:justify-between gap-8"
    >
      <!-- Brand + Description -->
      <div class="max-w-md">
        <a href="/" class="inline-flex items-center gap-2 shrink-0">
          <span
            class="inline-flex items-center justify-center rounded-md
          bg-primary text-primary-foreground h-7 w-7"
          >
            <ChartNoAxesCombined class="h-4 w-4" />
          </span>
          <span class="font-semibold">MaoniMarket</span>
        </a>
        <p class="text-xs pt-2 text-muted-foreground leading-relaxed">
          MaoniMarket Ltd. is Kenya’s prediction market platform for sports,
          politics, culture and public sentiment. Markets reflect participant
          opinion and should not be interpreted as financial advice.
        </p>
      </div>

      <!-- Minimal Links -->
      <div class="flex flex-col gap-2 text-xs text-muted-foreground">
        <a
          href="https://forms.gle/HEwNNnT6pSWZfaNT6"
          target="_blank"
          rel="noopener noreferrer"
          class="hover:text-foreground transition">Suggest a Market</a
        >
        <button
          type="button"
          class="text-left hover:text-foreground transition"
          onclick={() => (showHowItWorks = true)}>How It Works</button
        >
        <a href="/terms" class="hover:text-foreground transition">
          Terms of Use
        </a>
        <a href="/privacy" class="hover:text-foreground transition">
          Privacy Policy
        </a>
        <a
          href="mailto:maonimarket@gmail.com"
          class="hover:text-foreground transition"
        >
          Contact
        </a>
      </div>
    </div>

    <!-- Divider -->
    <div
      class="mt-8 pt-6 border-t border-border/40 text-[11px] text-muted-foreground leading-relaxed space-y-2"
    >
      <p>
        Trading involves risk. Prices are determined by market participants and
        may not reflect real-world probabilities.
      </p>

      <p>
        © {new Date().getFullYear()} MaoniMarket. All rights reserved.
      </p>
    </div>
  </div>
</footer>

{#if showHowItWorks}
  <HowItWorksModal {isAuthed} onClose={() => (showHowItWorks = false)} />
{/if}
