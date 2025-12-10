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
      <!-- NOTE: if your detail route is /markets/[id], change href to `/markets/${m.id}` -->
      <article
        class="card group rounded-xl border border-border/70 bg-card/80 shadow-sm hover:border-primary/40 transition-colors"
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
              <div class="relative h-11 w-11 shrink-0 mt-0.5">
                <div
                  class="gauge"
                  style={`--_p:${chanceOf(m) ?? FALLBACK_CHANCE}; --_fill: var(${(chanceOf(m) ?? FALLBACK_CHANCE) < 50 ? "--color-no" : "--color-yes"})`}
                ></div>

                <div
                  class="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
                >
                  {chanceOf(m) ?? FALLBACK_CHANCE}<span
                    class="ml-0.5 text-[10px]">%</span
                  >
                </div>
              </div>
            {/key}
          </div>

          <!-- Yes / No buttons -->
          <div class="px-4 lg:px-5 pt-3 pb-4">
            <div class="grid grid-cols-2 gap-3">
              <!-- YES -->
              <button type="button" class="btn btn-yes" on:click|preventDefault>
                <div class="flex items-center justify-center w-full">
                  <span>Yes</span>
                </div>
              </button>

              <!-- NO -->
              <button type="button" class="btn btn-no" on:click|preventDefault>
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
