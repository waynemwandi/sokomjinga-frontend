<!-- src/routes/(public)/market/[id]/+page.svelte -->

<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import type { PageData } from "./$types";

  export let data: PageData & { portfolioLabel?: string | null };

  const market = data.market;
  const outcomes = data.outcomes ?? [];
  const isAuthed = data.isAuthed ?? false;
  const portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";

  // same categories as homepage
  const categories = [
    "All markets",
    "Politics",
    "Crypto",
    "Finance",
    "Culture",
  ];

  // helpers -------------------------------------------------------------
  const priceOf = (o: any) => {
    if (typeof o?.price_kes === "number") return o.price_kes;
    if (typeof o?.price === "number") return o.price;
    if (typeof o?.price_cents === "number") return o.price_cents;
    if (typeof o?.cents === "number") return o.cents;
    return 0;
  };

  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE").format(v)}`;

  // detect YES/NO to style buttons with .btn-yes / .btn-no from app.css
  const isYes = (o: any) => /^(yes|true)$/i.test(o?.name ?? o?.label ?? "");
  const isNo = (o: any) => /^(no|false)$/i.test(o?.name ?? o?.label ?? "");
</script>

<!-- ===========================
  Header (shared with homepage)
=========================== -->
<AppHeader {isAuthed} {portfolioLabel} />

<!-- primary nav row (same as homepage) -->
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
  Content
=========================== -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  <!-- title + meta -->
  <div class="mb-4 flex items-start gap-4">
    <!-- thumbnail -->
    <div
      class="h-16 w-16 shrink-0 rounded bg-muted/60 overflow-hidden flex items-center justify-center text-xs"
    >
      {#if market.image_url}
        <img
          class="h-full w-full object-cover"
          src={market.image_url}
          alt={market.title ?? ""}
        />
      {:else}
        {(market.title ?? "MK").slice(0, 2).toUpperCase()}
      {/if}
    </div>

    <div class="flex-1 min-w-0">
      <h1 class="text-2xl md:text-3xl font-semibold leading-tight break-words">
        {market.title}
      </h1>
      <div class="mt-1 text-xs text-muted-foreground flex items-center gap-2">
        <span class="uppercase">{(market.status ?? "open").toUpperCase()}</span>
        {#if market.category}
          <span
            class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-[11px] bg-primary/10 text-primary"
            >{market.category}</span
          >
        {/if}
      </div>
    </div>
  </div>

  <!-- two columns -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- left -->
    <section class="md:col-span-2 space-y-6">
      <div class="rounded-xl border border-border bg-card">
        <div class="p-4 border-b border-border/60 text-sm font-medium">
          Price chart
        </div>
        <div
          class="h-[360px] m-4 rounded border border-dashed border-border/70 bg-muted/10 flex items-center justify-center text-sm text-muted-foreground"
        >
          Chart placeholder
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card">
        <div class="p-4 border-b border-border/60 text-sm font-medium">
          Market Context
        </div>
        <div class="p-4 text-sm text-muted-foreground">
          {market.description ?? "No description."}
        </div>
      </div>
    </section>

    <!-- right -->
    <aside class="md:col-span-1">
      <div class="rounded-xl border border-border bg-card overflow-hidden">
        <div class="p-4 border-b border-border/60 text-sm font-medium">Buy</div>

        <div class="p-3 space-y-3">
          {#if outcomes.length}
            {#each outcomes as o}
              <!-- Use .btn + .btn-yes / .btn-no from app.css -->
              <button
                class={`w-full btn ${
                  isYes(o) ? "btn-yes" : isNo(o) ? "btn-no" : ""
                } flex items-center justify-between`}
                aria-label={`Buy ${o.name ?? o.label ?? "Outcome"}`}
              >
                <span>{o.name ?? o.label ?? "Outcome"}</span>
                <span class="font-semibold">{formatKES(priceOf(o))}</span>
              </button>
            {/each}
          {:else}
            <div class="text-xs text-muted-foreground">No outcomes yet.</div>
          {/if}
        </div>

        <div class="p-3 border-t border-border/60 flex gap-2">
          <button class="rounded-md bg-neutral px-2 py-1 text-xs">
            +KES 100
          </button>
          <button class="rounded-md bg-neutral px-2 py-1 text-xs">
            +KES 500
          </button>
          <button class="rounded-md bg-neutral px-2 py-1 text-xs">
            +KES 1,000
          </button>
          <button class="rounded-md bg-neutral px-2 py-1 text-xs">Max</button>
        </div>
      </div>
    </aside>
  </div>
</main>
