<!-- src/routes/(public)/market/[id]/+page.svelte -->

<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import { onMount, onDestroy } from "svelte";

  export let data: PageData & {
    priceHistory?: any;
    initialSide?: "yes" | "no" | null;
  };

  const market = data.market;
  const outcomes = data.outcomes ?? [];
  const isAuthed = data.isAuthed ?? false;
  const priceHistory = data.priceHistory;

  console.log("CLIENT priceHistory:", priceHistory);
  console.log("CLIENT priceHistory.outcomes:", priceHistory?.outcomes);

  const portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";
  // const portfolioHref = data.portfolioHref ?? "/portfolio";
  // const depositHref = data.depositHref ?? "/portfolio?deposit=1";

  type Point = { x: number; y: number };

  // build a single line series (Yes) from history
  const chartSeries = (() => {
    if (!priceHistory?.outcomes?.length) return [];

    const yes = priceHistory.outcomes.find((o: any) =>
      /^(yes|true)$/i.test(o.label ?? "")
    );
    if (!yes || !yes.points?.length) return [];

    const pts = yes.points as { price_cents: number }[];

    if (pts.length === 1) {
      return [
        {
          outcome_id: yes.outcome_id,
          points: [{ x: 50, y: 20 }], // center single point
          areaPath: "",
        },
      ];
    }

    const minPrice = 0;
    const maxPrice = 100;
    const range = maxPrice - minPrice || 1;
    const n = pts.length;

    const mapped: Point[] = pts.map((p, i) => {
      const t = n === 1 ? 0 : i / (n - 1);
      const x = 5 + t * 90; // padding
      const norm = (p.price_cents - minPrice) / range;
      const y = 35 - norm * 25; // invert for SVG coords
      return { x, y };
    });

    const first = mapped[0];
    const last = mapped[mapped.length - 1];
    const areaPath = [
      `M ${first.x} 35`,
      ...mapped.map((p) => `L ${p.x} ${p.y}`),
      `L ${last.x} 35`,
      "Z",
    ].join(" ");

    return [
      {
        outcome_id: yes.outcome_id,
        points: mapped,
        areaPath,
      },
    ];
  })();

  // same categories as homepage
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

  // --- Buy panel state (selected side + shares) -----------------------
  const yesOutcome: any = outcomes.find((o: any) => isYes(o));
  const noOutcome: any = outcomes.find((o: any) => isNo(o));

  let selectedSide: "yes" | "no" =
    (data.initialSide as "yes" | "no" | null) ?? "yes";

  let selectedOutcome: any;

  if (data.initialSide === "yes" && yesOutcome) {
    selectedSide = "yes";
    selectedOutcome = yesOutcome;
  } else if (data.initialSide === "no" && noOutcome) {
    selectedSide = "no";
    selectedOutcome = noOutcome;
  } else {
    selectedOutcome =
      yesOutcome ?? noOutcome ?? (outcomes.length ? outcomes[0] : null);
  }

  let shares = 1;

  const selectOutcome = (o: any) => {
    selectedOutcome = o;

    if (o === yesOutcome) {
      selectedSide = "yes";
    } else if (o === noOutcome) {
      selectedSide = "no";
    }
  };

  const incShares = () => {
    shares = shares + 1;
  };

  const decShares = () => {
    if (shares > 1) shares = shares - 1;
  };

  $: pricePerShare = selectedOutcome ? priceOf(selectedOutcome) : 0;
  $: totalKES = shares * pricePerShare;

  const statusMeta = (m: any) => {
    const s = (m.status ?? "open").toLowerCase();

    if (s === "closed") {
      return {
        label: "Closed",
        cls: "bg-red-500/10 text-red-400 border-red-500/30",
      };
    }

    if (s === "open") {
      return {
        label: "Open",
        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }

    return {
      label: "Upcoming",
      cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
  };

  const yesOutcomeStats = outcomes.find((o: any) =>
    /^(yes|true)$/i.test(o?.label ?? o?.name ?? "")
  );

  const yesPct = yesOutcomeStats ? Math.round(priceOf(yesOutcomeStats)) : null;

  const volumeKES =
    typeof market.volume_cents === "number"
      ? market.volume_cents / 100
      : typeof market.volume_kes === "number"
        ? market.volume_kes
        : null;

  const formatCompactKES = (v: number) => {
    if (v < 10_000) return `KES ${v.toLocaleString("en-KE")}`;
    if (v < 1_000_000) return `KES ${(v / 1_000).toFixed(1)}K`;
    if (v < 1_000_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`;
    return `KES ${(v / 1_000_000_000).toFixed(1)}B`;
  };

  const resolveDate = market.resolve_at
    ? new Date(market.resolve_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  // TEMP placeholders (until backend wires real data)
  const placeholderDeltaPct = 3; // +3%

  let chartEl: HTMLDivElement | null = null;
  let chart: ReturnType<typeof createChart> | null = null;
  let series: any = null;

  const yesHistory = priceHistory?.outcomes?.find((o: any) =>
    /^(yes|true)$/i.test(o.label ?? "")
  );

  console.log("YES history resolved:", yesHistory);
  console.log("YES history points:", yesHistory?.points);

  const chartData = yesHistory?.points?.length
    ? yesHistory.points
        .map((p: any, i: number) => ({
          time: Math.floor(new Date(p.t).getTime() / 1000) + i,
          value: p.price_cents,
        }))
        .sort((a: any, b: any) => Number(a.time) - Number(b.time))
    : [];

  console.log("chartData length:", chartData.length);
  console.log("chartData:", chartData);

  onMount(async () => {
    if (!chartEl || chartData.length === 0) return;

    const { createChart } = await import("lightweight-charts");

    const chart = createChart(chartEl, {
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.1)" },
        horzLines: { color: "rgba(148,163,184,0.1)" },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.15 },
      },
      crosshair: { mode: 1 },
    });

    const series = chart.addAreaSeries({
      lineColor: "#2dd4bf",
      topColor: "rgba(45,212,191,0.35)",
      bottomColor: "rgba(45,212,191,0.02)",
    });

    series.setData(chartData);
    chart.timeScale().fitContent();
  });
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
        on:click={() => goto(`/?category=${encodeURIComponent(c)}`)}
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
        <span
          class={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] ${statusMeta(market).cls}`}
        >
          {statusMeta(market).label}
        </span>
        {#if market.category}
          <span
            class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-[11px] bg-primary/10 text-primary"
            >{market.category}</span
          >
        {/if}
      </div>
    </div>
  </div>

  <!-- Market summary (Polymarket-style) -->
  <div class="mb-6 flex flex-col gap-2">
    <!-- YES chance -->
    <div class="flex items-center gap-3">
      <div class="text-3xl font-semibold text-primary">
        {yesPct !== null ? `${yesPct}% chance` : "—"}
      </div>

      <!-- Placeholder uptick -->
      <div class="flex items-center gap-1 text-sm font-medium text-emerald-400">
        <span class="inline-block translate-y-[1px]">▲</span>
        <span>{placeholderDeltaPct}%</span>
      </div>
    </div>

    <!-- Volume + date -->
    <div class="flex items-center gap-4 text-sm text-muted-foreground">
      {#if volumeKES}
        <span>{formatCompactKES(volumeKES)} Vol.</span>
      {/if}

      {#if resolveDate}
        <span class="flex items-center gap-1">
          <span>•</span>
          <span>{resolveDate}</span>
        </span>
      {/if}
    </div>
  </div>

  <!-- two columns -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- left: chart + context -->
    <section class="md:col-span-2 space-y-6">
      <!-- Price chart card -->
      <div class="rounded-xl border border-border bg-card">
        <!-- <div class="p-4 border-b border-border/60 text-sm font-medium">
          Price chart
        </div> -->
        <div class="h-[320px] md:h-[360px] px-4 pb-4 pt-3">
          <div
            class="h-full rounded-lg bg-background/40 border border-border/40 p-4"
          >
            {#if chartData.length}
              <div
                bind:this={chartEl}
                style="width: 100%; height: 300px;"
              ></div>
            {:else}
              <div
                class="h-full flex items-center justify-center text-sm text-muted-foreground"
              >
                No price history yet.
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Market context card -->
      <div class="rounded-xl border border-border bg-card">
        <div class="p-4 border-b border-border/60 text-sm font-medium">
          Market Context
        </div>
        <div class="p-4 text-sm text-muted-foreground">
          {market.description ?? "No description."}
        </div>
      </div>
    </section>

    <!-- right: Buy panel -->
    <aside class="md:col-span-1">
      <form
        method="POST"
        action="?/buy"
        class="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div
          class="p-4 border-b border-border/60 text-sm font-medium flex items-center justify-between"
        >
          <span>Buy</span>
          {#if selectedOutcome}
            <span class="text-xs text-muted-foreground">
              Price per share: <span class="text-primary"
                >{formatKES(pricePerShare)}</span
              >
            </span>
          {/if}
        </div>

        <!-- hidden fields that go to the buy action -->
        <input type="hidden" name="side" value={selectedSide} />
        <input type="hidden" name="shares" value={shares} />
        <!-- pricePerShare is in KES; convert to cents for the backend -->
        <input
          type="hidden"
          name="price_cents"
          value={Math.round(pricePerShare * 100)}
        />

        <div class="p-4 space-y-5">
          {#if outcomes.length}
            <!-- YES / NO toggle row -->
            <div class="grid grid-cols-2 gap-2">
              {#if yesOutcome}
                <button
                  type="button"
                  class={`btn flex flex-col items-center justify-center text-sm ${
                    selectedOutcome === yesOutcome
                      ? "btn-yes animate-pulse"
                      : "bg-card border-border"
                  }`}
                  on:click={() => selectOutcome(yesOutcome)}
                >
                  <span>Yes</span>
                  <span class="mt-0.5 text-[11px] opacity-80">
                    {formatKES(priceOf(yesOutcome))}
                  </span>
                </button>
              {/if}

              {#if noOutcome}
                <button
                  type="button"
                  class={`btn flex flex-col items-center justify-center text-sm ${
                    selectedOutcome === noOutcome
                      ? "btn-no animate-pulse"
                      : "bg-card border-border"
                  }`}
                  on:click={() => selectOutcome(noOutcome)}
                >
                  <span>No</span>
                  <span class="mt-0.5 text-[11px] opacity-80">
                    {formatKES(priceOf(noOutcome))}
                  </span>
                </button>
              {/if}
            </div>

            <!-- Shares selector -->
            <div class="space-y-2">
              <div
                class="flex items-center justify-between text-xs text-primary-foreground"
              >
                <span>Shares</span>
                <span>Price / share: {formatKES(pricePerShare)}</span>
              </div>

              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-card hover:bg-accent"
                  on:click={decShares}
                  aria-label="Decrease shares"
                >
                  –
                </button>

                <div
                  class="flex-1 text-center rounded-md bg-input py-2 text-sm font-medium"
                >
                  {shares}
                </div>

                <button
                  type="button"
                  class="h-9 w-9 flex items-center justify-center rounded-md border border-border bg-card hover:bg-accent"
                  on:click={incShares}
                  aria-label="Increase shares"
                >
                  +
                </button>
              </div>
            </div>

            <!-- Quick share presets -->
            <div class="flex gap-2 pt-1">
              <button
                type="button"
                class="rounded-md bg-input px-2 py-1 text-xs"
                on:click={() => (shares = shares + 1)}
              >
                +1
              </button>
              <button
                type="button"
                class="rounded-md bg-input px-2 py-1 text-xs"
                on:click={() => (shares = shares + 5)}
              >
                +5
              </button>
              <button
                type="button"
                class="rounded-md bg-input px-2 py-1 text-xs"
                on:click={() => (shares = shares + 10)}
              >
                +10
              </button>
            </div>

            <!-- Total cost -->
            <div
              class="flex items-center justify-between pt-3 text-xs text-muted-foreground"
            >
              <span>Estimated cost</span>
              <span class="text-sm font-semibold text-foreground">
                {formatKES(totalKES)}
              </span>
            </div>

            <!-- Submit -->
            <button
              type="submit"
              class="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              disabled={!selectedOutcome || !shares || pricePerShare <= 0}
            >
              Place order · {formatKES(totalKES)}
            </button>
          {:else}
            <div class="text-xs text-muted-foreground">No outcomes yet.</div>
          {/if}
        </div>
      </form>
    </aside>
  </div>
</main>
