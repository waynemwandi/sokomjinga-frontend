<!-- src/routes/(public)/market/[id]/+page.svelte -->

<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import type { PageData } from "./$types";
  import { goto } from "$app/navigation";
  import type { IChartApi, ISeriesApi, Time } from "lightweight-charts";
  import { onMount, onDestroy } from "svelte";
  import { PUBLIC_API_BASE } from "$env/static/public";
  import { browser } from "$app/environment";
  import { enhance } from "$app/forms";

  let { data } = $props<{
    data: PageData & {
      priceHistory?: any;
      initialSide?: "yes" | "no" | null;
    };
  }>();

  let market = $state(data.market);
  let outcomes = $state(data.outcomes ?? []);
  let priceHistory = $state(data.priceHistory);
  let selectedRange = $state<"1H" | "1D" | "1W" | "1M" | "ALL">("ALL");
  let isSubmitting = $state(false);

  const isAuthed = data.isAuthed ?? false;

  const portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";

  type Point = { x: number; y: number };

  // build a single line series (Yes) from history
  const chartSeries = (() => {
    if (!priceHistory?.outcomes?.length) return [];

    const yes = priceHistory.outcomes.find((o: any) =>
      /^(yes|true)$/i.test(o.label ?? ""),
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
    `KES ${Math.round(v).toLocaleString("en-KE")}`;

  // detect YES/NO to style buttons with .btn-yes / .btn-no from app.css
  const isYes = (o: any) => /^(yes|true)$/i.test(o?.name ?? o?.label ?? "");
  const isNo = (o: any) => /^(no|false)$/i.test(o?.name ?? o?.label ?? "");

  // --- Buy panel state (selected side) -----------------------
  type Outcome = {
    id: string;
    label?: string;
    name?: string;
    price_cents?: number;
    price?: number;
    price_kes?: number;
    total_stake_cents?: number;
  };

  const yesOutcome = $derived(outcomes.find((o: Outcome) => isYes(o)));

  const noOutcome = $derived(outcomes.find((o: Outcome) => isNo(o)));

  $effect(() => {
    if (selectedOutcome && outcomes.length) {
      const match = outcomes.find((o: Outcome) => o.id === selectedOutcome?.id);

      if (match) {
        selectedOutcome = match;
      }
    }
  });

  let selectedSide = $state<"yes" | "no">(
    (data.initialSide as "yes" | "no" | null) ?? "yes",
  );

  let selectedOutcome = $state<Outcome | null>(null);

  let amountKES = $state<number | "">("");

  $effect(() => {
    if (!selectedOutcome && outcomes.length) {
      if (data.initialSide === "yes" && yesOutcome) {
        selectedOutcome = yesOutcome;
        selectedSide = "yes";
      } else if (data.initialSide === "no" && noOutcome) {
        selectedOutcome = noOutcome;
        selectedSide = "no";
      } else {
        selectedOutcome = yesOutcome ?? noOutcome ?? outcomes[0];
      }
    }
  });

  const selectOutcome = (o: any) => {
    selectedOutcome = o;

    if (o === yesOutcome) {
      selectedSide = "yes";
    } else if (o === noOutcome) {
      selectedSide = "no";
    }
  };

  const pricePerShare = $derived(
    selectedOutcome ? priceOf(selectedOutcome) : 0,
  );
  const totalKES = $derived(Number(amountKES || 0));
  const potentialPayoutKES = $derived.by(() => {
    const amt = Number(amountKES || 0);
    if (!selectedOutcome || amt <= 0) return 0;

    const stakeKES = amt;
    const stakeCents = Math.round(stakeKES * 100);

    const currentWinningPool = selectedPool;
    const currentLosingPool = oppositePool;

    const newWinningPool = currentWinningPool + stakeCents;
    const newTotalPool = currentWinningPool + currentLosingPool + stakeCents;

    if (newWinningPool <= 0 || newTotalPool <= 0) return 0;

    const feeRate = (market.fee_rate_bps ?? 500) / 10000;
    const fee = newTotalPool * feeRate;
    const distributable = newTotalPool - fee;

    const payoutCents = (stakeCents * distributable) / newWinningPool;

    return payoutCents / 100;
  });

  const profitKES = $derived(potentialPayoutKES - totalKES);

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

  const yesOutcomeStats = $derived(
    outcomes.find((o: any) => /^(yes|true)$/i.test(o?.label ?? o?.name ?? "")),
  );

  const yesPct = $derived(
    yesOutcomeStats ? Math.round(priceOf(yesOutcomeStats)) : null,
  );

  const volumeKES = $derived(
    typeof market.volume_cents === "number"
      ? market.volume_cents / 100
      : typeof market.volume_kes === "number"
        ? market.volume_kes
        : null,
  );

  const selectedPool = $derived(
    selectedOutcome ? Number(selectedOutcome.total_stake_cents ?? 0) : 0,
  );

  const oppositePool = $derived(
    selectedOutcome
      ? Number(
          outcomes.find((o: Outcome) => o.id !== selectedOutcome!.id)
            ?.total_stake_cents ?? 0,
        )
      : 0,
  );

  const formatCompactKES = (v: number) => {
    if (v < 10_000) return `KES ${v.toLocaleString("en-KE")}`;
    if (v < 1_000_000) return `KES ${(v / 1_000).toFixed(1)}K`;
    if (v < 1_000_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`;
    return `KES ${(v / 1_000_000_000).toFixed(1)}B`;
  };

  let pollingInterval: ReturnType<typeof setInterval>;

  const fetchMarket = async () => {
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/markets/${market.id}`, {
        headers: { accept: "application/json" },
      });

      if (!res.ok) return;

      const updated = await res.json();

      if (!updated) return;

      // Normalize (same philosophy as homepage)
      const updatedMarket = {
        ...updated,
        image_url: updated.image_url ?? updated.img ?? null,
        volume_cents: updated.volume_cents ?? 0,
      };

      const updatedOutcomes = updated.outcomes ?? [];

      market = updatedMarket;
      outcomes = updatedOutcomes;
    } catch (err) {
      console.error("Market polling failed:", err);
    }
  };

  const fetchPriceHistory = async () => {
    try {
      const res = await fetch(
        `${PUBLIC_API_BASE}/markets/${market.id}/price-history`,
      );

      if (!res.ok) return;

      const updated = await res.json();

      if (!updated) return;

      if (JSON.stringify(priceHistory) !== JSON.stringify(updated)) {
        priceHistory = updated;

        if (series && chart) {
          updateChart();
        }
      }
    } catch (err) {
      console.error("Price history polling failed:", err);
    }
  };

  onMount(() => {
    fetchMarket();
    fetchPriceHistory();

    pollingInterval = setInterval(() => {
      fetchMarket();
      fetchPriceHistory();
    }, 3000);
  });

  onDestroy(() => {
    if (pollingInterval) clearInterval(pollingInterval);
    if (browser) {
      window.removeEventListener("resize", resizeChart);
    }
  });

  const projectedEndDate = $derived(
    market.projected_end_date
      ? new Date(market.projected_end_date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null,
  );

  const hasVolume = $derived(typeof volumeKES === "number" && volumeKES > 0);

  const volumeLabel = $derived(
    hasVolume ? `${formatCompactKES(volumeKES)} Vol.` : "– Vol.",
  );

  const projectedEndLabel = $derived(
    projectedEndDate ? `Ends ${projectedEndDate}` : "Ends –",
  );

  let chartEl = $state<HTMLDivElement | null>(null);
  let chart: IChartApi | null = null;
  let hasFitContent = false;
  let series: ISeriesApi<"Area"> | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout>;

  const resizeChart = () => {
    if (!chartEl || !chart) return;

    const el = chartEl;
    const c = chart;

    clearTimeout(resizeTimeout);

    resizeTimeout = setTimeout(() => {
      c.applyOptions({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    }, 100);
  };

  const yesHistory = $derived(
    priceHistory?.outcomes?.find((o: any) =>
      /^(yes|true)$/i.test(o.label ?? ""),
    ),
  );

  const deltaPct = $derived(
    yesHistory?.points?.length
      ? yesHistory.points.length < 2
        ? 0
        : Math.round(
            yesHistory.points[yesHistory.points.length - 1].price_cents -
              yesHistory.points[yesHistory.points.length - 2].price_cents,
          )
      : null,
  );

  const filterByRange = (points: any[], range: string) => {
    if (!points?.length || range === "ALL") return points;

    const now = Date.now();

    const ranges: Record<string, number> = {
      "1H": 60 * 60 * 1000,
      "1D": 24 * 60 * 60 * 1000,
      "1W": 7 * 24 * 60 * 60 * 1000,
      "1M": 30 * 24 * 60 * 60 * 1000,
    };

    const cutoff = now - (ranges[range] ?? 0);

    const filtered = points.filter((p) => new Date(p.t).getTime() >= cutoff);

    // fallback: if filter kills everything, show last few points
    return filtered;
  };

  function buildChartData() {
    if (!yesHistory?.points?.length) return [];

    const mapped = filterByRange(yesHistory.points, selectedRange)
      .map((p: any, i: number) => ({
        time: (Math.floor(new Date(p.t).getTime() / 1000) + i) as Time,
        value: p.price_cents,
      }))
      .sort((a: any, b: any) => Number(a.time) - Number(b.time));

    if (mapped.length === 1) {
      return [
        mapped[0],
        {
          ...mapped[0],
          time: ((mapped[0].time as number) + 1) as Time,
        },
      ];
    }

    return mapped;
  }

  const hasChartData = $derived(buildChartData().length > 0);

  function updateChart() {
    if (!series || !chart) return;

    const data = buildChartData();

    series.setData(data);

    if (!hasFitContent) {
      chart.timeScale().fitContent();
      hasFitContent = true;
    }
  }

  onMount(async () => {
    if (!chartEl) return;
    const { createChart } = await import("lightweight-charts");

    chart = createChart(chartEl, {
      layout: {
        background: { color: "transparent" },
        textColor: "#94a3b8",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.1)" },
        horzLines: { color: "rgba(148,163,184,0.1)" },
      },
      watermark: {
        visible: true,
        fontSize: 18,
        horzAlign: "right",
        vertAlign: "top",
        color: "rgba(0,0,0,0.2)",
        text: "MaoniMarket",
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightBarStaysOnScroll: true,
        fixLeftEdge: true,
        fixRightEdge: true,
        tickMarkFormatter: (time: Time) => {
          if (typeof time !== "number") return "";

          const d = new Date(time * 1000);
          const now = Date.now();
          const rangeDays = (now - d.getTime()) / (1000 * 60 * 60 * 24);

          if (rangeDays < 1) {
            return d.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          if (rangeDays < 60) {
            return d.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
          }

          return d.toLocaleDateString("en-GB", {
            month: "short",
            year: "numeric",
          });
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.15, bottom: 0.25 },
      },
      crosshair: { mode: 1 },
      handleScroll: {
        mouseWheel: false,
        pressedMouseMove: false,
        horzTouchDrag: false,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: false,
      },
      kineticScroll: {
        mouse: false,
        touch: false,
      },
    });

    series = chart.addAreaSeries({
      lineColor: "#2dd4bf",
      topColor: "rgba(45,212,191,0.35)",
      bottomColor: "rgba(45,212,191,0.02)",
    });
    updateChart();
    chart.timeScale().fitContent();
    resizeChart();
    if (browser) {
      window.addEventListener("resize", resizeChart);
    }
  });

  const isTradable = $derived((market.status ?? "").toLowerCase() === "open");
</script>

<svelte:head>
  <title>{market.title} | MaoniMarket</title>
  <meta
    name="description"
    content={`Express a view on: ${market.title}. Participate in a structured Yes/No market powered by M-Pesa.`}
  />
  <meta property="og:title" content={market.title} />
  <meta property="og:description" content={market.description ?? ""} />
  <meta name="twitter:card" content="summary_large_image" />
</svelte:head>

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
        onclick={() => goto(`/?category=${encodeURIComponent(c)}`)}
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
      {#if deltaPct !== null}
        <div
          class={`flex items-center gap-1 text-sm font-medium ${
            deltaPct >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          <span class="inline-block translate-y-[1px]">
            {deltaPct >= 0 ? "▲" : "▼"}
          </span>
          <span>{Math.abs(deltaPct)}%</span>
        </div>
      {/if}
    </div>

    <!-- Volume + projected end -->
    <div class="flex items-center gap-2 text-sm text-muted-foreground">
      <span>{volumeLabel}</span>
      <span class="opacity-60">|</span>
      <span>{projectedEndLabel}</span>
    </div>

    <!-- two columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- left: chart + context -->
      <section class="md:col-span-2 space-y-6">
        <!-- Price chart card -->
        <div
          class="rounded-xl border border-border/50 bg-card text-sm font-medium"
        >
          <div class="h-[320px] md:h-[360px] px-4 pb-4 pt-3">
            <!-- Range selector -->
            <div class="flex justify-end gap-2 mb-2">
              {#each ["1H", "1D", "1W", "1M", "ALL"] as r (r)}
                <button
                  class={`px-2 py-1 text-xs rounded-md border ${
                    selectedRange === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                  onclick={() => {
                    selectedRange = r as typeof selectedRange;
                    updateChart();
                  }}
                >
                  {r}
                </button>
              {/each}
            </div>
            <div class="h-full rounded-lg bg-background/40 p-2 md:p-3">
              <div class="relative w-full h-[260px] overflow-hidden">
                <div bind:this={chartEl} class="w-full h-full"></div>

                {#if !hasChartData}
                  <div
                    class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
                  >
                    No data in this range
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>

        <!-- Order book card (placeholder) -->
        <div class="rounded-xl border border-border bg-card">
          <div
            class="p-4 border-b border-border/60 text-sm font-medium flex items-center justify-between"
          >
            <span>Order Book</span>
          </div>

          <div class="p-4 text-sm text-muted-foreground italic">
            Order book coming soon.
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
          use:enhance={() => {
            isSubmitting = true;

            return async ({ result }: { result: any }) => {
              isSubmitting = false;
              await fetchMarket();
              await fetchPriceHistory();
            };
          }}
        >
          <div
            class="p-4 border-b border-border/60 text-sm font-medium flex items-center justify-between"
          >
            <span>Buy</span>
          </div>

          <!-- hidden fields that go to the buy action -->
          <input type="hidden" name="side" value={selectedSide} />
          <input
            type="hidden"
            name="amount_cents"
            value={Math.round(Number(amountKES || 0) * 100)}
          />
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
                    disabled={!isTradable}
                    class={`btn flex flex-col items-center justify-center text-sm
                      ${
                        selectedOutcome === yesOutcome
                          ? "btn-yes animate-pulse"
                          : "bg-card border-border"
                      }
                      ${!isTradable ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onclick={() => isTradable && selectOutcome(yesOutcome)}
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
                    disabled={!isTradable}
                    class={`btn flex flex-col items-center justify-center text-sm
                    ${
                      selectedOutcome === noOutcome
                        ? "btn-no animate-pulse"
                        : "bg-card border-border"
                    }
                    ${!isTradable ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                    onclick={() => isTradable && selectOutcome(noOutcome)}
                  >
                    <span>No</span>
                    <span class="mt-0.5 text-[11px] opacity-80">
                      {formatKES(priceOf(noOutcome))}
                    </span>
                  </button>
                {/if}
              </div>
              <!-- Amount input -->
              <div class="space-y-3">
                <div
                  class="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <span>Amount</span>
                  <span>KES</span>
                </div>

                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  min="0"
                  placeholder="0"
                  class="w-full rounded-md bg-input px-3 py-3 text-lg font-semibold outline-none text-right"
                  bind:value={amountKES}
                  disabled={!isTradable}
                  onfocus={() => {
                    if (Number(amountKES || 0) === 0) amountKES = "";
                  }}
                  onblur={() => {
                    if (amountKES === "") amountKES = 0;
                  }}
                  oninput={(e) => {
                    const v = e.currentTarget.value;
                    if (v === "") return;
                    amountKES = Math.max(0, Math.floor(Number(v)));
                  }}
                />
              </div>

              <!-- Quick amounts -->
              <div class="flex gap-2 pt-1">
                {#each [50, 100, 500, 1000] as amt}
                  <button
                    type="button"
                    class="rounded-md bg-input px-3 py-1 text-xs"
                    onclick={() => (amountKES = amt)}
                  >
                    KES {amt}
                  </button>
                {/each}
              </div>

              <!-- Big payout display -->
              {#if Number(amountKES || 0) > 0}
                <div class="pt-4 border-t border-border/50">
                  <div class="text-xs text-muted-foreground mb-1 text-right">
                    To win
                  </div>
                  <div
                    class="text-3xl md:text-4xl font-semibold text-emerald-400 text-right w-full"
                  >
                    {formatKES(potentialPayoutKES)}
                  </div>

                  <div
                    class="text-[11px] text-muted-foreground text-right mt-1"
                  >
                    Based on current market conditions
                  </div>
                </div>
              {/if}
              {#if !isTradable}
                <div class="text-xs text-amber-400">
                  This market is no longer open for trading.
                </div>
              {/if}
              <!-- Submit -->
              <button
                type="submit"
                class="mt-3 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={!isTradable ||
                  !selectedOutcome ||
                  Number(amountKES || 0) <= 0 ||
                  pricePerShare <= 0 ||
                  isSubmitting}
              >
                {#if isSubmitting}
                  <span class="animate-pulse">Placing...</span>
                {:else}
                  <span>Place order · {formatKES(Number(amountKES || 0))}</span>
                {/if}
              </button>
            {:else}
              <div class="text-xs text-muted-foreground">No outcomes yet.</div>
            {/if}
          </div>
        </form>
      </aside>
    </div>
  </div>
</main>
