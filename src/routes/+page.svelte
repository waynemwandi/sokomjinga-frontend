<!-- src/routes/+page.svelte -->
<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  // import { toggleTheme } from "$lib/theme";
  import {
    ChartNoAxesCombined,
    Sun,
    Moon,
    Bookmark,
    Gift,
    LogIn,
    LogOut,
    UserRound,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";

  // Server data
  export let data: {
    isAuthed: boolean;
    markets: any[];
    portfolioLabel?: string | null;
  };

  let isAuthed = data.isAuthed;
  let portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";
  let openMenu = false;

  const categories = [
    "All markets",
    "Politics",
    "Crypto",
    "Finance",
    "Culture",
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

  const volLabel = (m: any) => (m.volume ? m.volume : "— Vol.");
  const FALLBACK_CHANCE = 54;
  const GAUGE_LENGTH = 141.37; // approx π * r for r ≈ 45

  const gaugeDashOffset = (p: number | null) => {
    const pct = p ?? FALLBACK_CHANCE;
    const clamped = Math.max(0, Math.min(100, pct));
    return GAUGE_LENGTH * (1 - clamped / 100);
  };

  const gaugeColor = (m: any) => {
    const pct = chanceOf(m) ?? FALLBACK_CHANCE;
    // Use your existing CSS vars for yes/no colors
    return pct < 50 ? "var(--color-no)" : "var(--color-yes)";
  };

  const goLogin = () => goto("/login");
</script>

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
        class="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent"
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
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    {#each data.markets as m}
      <article
        class="card group rounded-xl border border-border/70 bg-card/80 shadow-sm hover:border-primary/40 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
      >
        <a href={`/market/${encodeURIComponent(m.id)}`} class="group block">
          <!-- Thumb + Title + Gauge -->
          <div
            class="p-4 lg:p-5 flex items-start gap-4 border-b border-border/60"
          >
            <!-- Thumb -->
            <div
              class="h-12 w-12 shrink-0 rounded bg-muted/60 overflow-hidden flex items-center justify-center text-xs"
            >
              {#if m.image_url}
                <img
                  class="h-full w-full object-cover"
                  src={m.image_url}
                  alt={m.title ?? ""}
                />
              {:else}
                {m.title?.slice(0, 2)?.toUpperCase() ?? "MK"}
              {/if}
            </div>

            <!-- Title (show full question) -->
            <div class="min-w-0 flex-1">
              <!-- Removed line-clamp; allow wrapping; slightly smaller text -->
              <h3
                class="text-[14px] md:text-[15px] font-semibold leading-snug break-words"
              >
                {m.title}
              </h3>
              {#if m.category}
                <span
                  class="mt-1 inline-flex items-center rounded-md border border-border px-2 py-0.5 text-[11px] bg-primary/10 text-primary"
                >
                  {m.category}
                </span>
              {/if}
            </div>

            <!-- Gauge -->
            {#key m.id}
              <div
                class="relative h-12 w-20 shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110"
              >
                <svg viewBox="0 0 100 50" class="w-full h-full">
                  <!-- background track -->
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="rgba(148,163,184,0.25)"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                  <!-- active arc -->
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke-linecap="round"
                    stroke-width="6"
                    style={`stroke: ${gaugeColor(m)}; stroke-dasharray: ${GAUGE_LENGTH}; stroke-dashoffset: ${gaugeDashOffset(
                      chanceOf(m)
                    )};`}
                  />
                </svg>

                <!-- text overlay -->
                <div
                  class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center translate-y-[18px]"
                >
                  <div class="text-[14px] font-semibold leading-none">
                    {chanceOf(m) ?? FALLBACK_CHANCE}
                    <span class="ml-0.5 text-[11px] font-medium">%</span>
                  </div>
                  <span class="mt-0.5 text-[12px] text-muted-foreground/90">
                    chance
                  </span>
                </div>
              </div>
            {/key}
          </div>

          <!-- Yes / No buttons -->
          <div class="px-4 lg:px-5 pt-3 pb-4">
            <div class="grid grid-cols-2 gap-3">
              <!-- YES -->
              <button
                type="button"
                class="btn btn-yes transition-transform active:scale-95"
                on:click|preventDefault={() =>
                  goto(`/market/${encodeURIComponent(m.id)}?side=yes`)}
              >
                <div class="flex items-center justify-center w-full">
                  <span>Yes</span>
                </div>
              </button>

              <!-- NO -->
              <button
                type="button"
                class="btn btn-no transition-transform active:scale-95"
                on:click|preventDefault={() =>
                  goto(`/market/${encodeURIComponent(m.id)}?side=no`)}
              >
                <div class="flex items-center justify-center w-full">
                  <span>No</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="px-4 lg:px-5 pb-4 pt-3 flex items-center text-xs text-muted-foreground"
          >
            <span class="flex-1">{volLabel(m)}</span>
            <div
              class="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <button
                class="p-1 rounded hover:bg-accent"
                on:click|preventDefault
                aria-label="Gift"
              >
                <Gift class="h-4 w-4" />
              </button>
              <button
                class="p-1 rounded hover:bg-accent"
                on:click={goLogin}
                aria-label="Bookmark"
                title="Bookmark"
              >
                <Bookmark class="h-4 w-4" />
              </button>
            </div>
          </div>
        </a>
      </article>
    {/each}
  </div>
</main>
