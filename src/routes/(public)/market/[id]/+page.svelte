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
  import { portfolio } from "$lib/stores/portfolio";

  let { data } = $props<{
    data: PageData & {
      priceHistory?: any;
      initialSide?: "yes" | "no" | null;
      marketBets?: MarketBet[];
    };
  }>();

  let market = $state(data.market);
  let outcomes = $state(data.outcomes ?? []);
  let priceHistory = $state(data.priceHistory);
  let selectedRange = $state<"1H" | "1D" | "1W" | "1M" | "ALL">("ALL");
  let chartSide = $state<"yes" | "no">(
    data.initialSide === "no" ? "no" : "yes",
  );
  let isSubmitting = $state(false);
  let showMobileBuy = $state(false);

  const isAuthed = data.isAuthed ?? false;

  // const portfolioLabel = data.portfolioLabel ?? "Portfolio KES 0.00";

  type Point = { x: number; y: number };

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
    status?: string | null;
  };

  type MarketBet = {
    bet_id?: string;
    id?: string;
    market_id?: string;
    title?: string;
    category?: string;
    market_status?: string | null;
    prediction?: "yes" | "no" | string;
    result?: "correct" | "incorrect" | "pending" | string;
    created_at?: string;
    close_at?: string | null;
    projected_end_date?: string | null;
    stake_cents?: number;
    anticipated_payout_cents?: number | null;
    settled_payout_cents?: number | null;
    yes_percentage?: number;
    no_percentage?: number;
  };

  type MarketPosition = {
    id: string;
    prediction: "yes" | "no";
    result: "correct" | "incorrect" | "pending";
    status: "open" | "closed" | "settled";
    stakeCents: number;
    payoutCents: number | null;
    payoutLabel: string;
    outcomeLabel: string;
    outcomeCents: number | null;
    outcomeTone: "green" | "red" | "neutral";
    date: string;
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

  const setActiveSide = (side: "yes" | "no") => {
    selectedSide = side;
    chartSide = side;

    const outcome = side === "yes" ? yesOutcome : noOutcome;
    if (outcome) selectedOutcome = outcome;

    hasFitContent = false;
    updateChart();
  };

  const selectOutcome = (o: any) => {
    selectedOutcome = o;

    if (o === yesOutcome) {
      setActiveSide("yes");
    } else if (o === noOutcome) {
      setActiveSide("no");
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
  const selectedPricePercent = $derived(
    selectedOutcome ? Math.round(priceOf(selectedOutcome)) : 0,
  );
  const selectedSideLabel = $derived(selectedSide === "yes" ? "Yes" : "No");
  const profitToneClass = $derived(
    profitKES > 0
      ? "text-emerald-500 dark:text-emerald-400"
      : profitKES < 0
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground",
  );
  const selectedSideToneClass = $derived(
    selectedSide === "yes"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-red-600 dark:text-red-400",
  );

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

  const formatDate = (d?: string | null) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "-";

    return dt.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCents = (cents?: number | null) =>
    typeof cents === "number" ? formatKES(cents / 100) : "Pending";

  const outcomeLabelOf = (o?: Outcome | null) =>
    o?.label ?? o?.name ?? "Outcome";

  const toResultKind = (
    status?: string | null,
  ): "correct" | "incorrect" | "pending" => {
    const s = (status || "").toLowerCase();
    if (s === "won" || s === "correct" || s === "settled_won") {
      return "correct";
    }
    if (s === "lost" || s === "incorrect" || s === "settled_lost") {
      return "incorrect";
    }
    return "pending";
  };

  const positionToneClass = (tone: "green" | "red" | "neutral") =>
    tone === "green"
      ? "text-emerald-500 dark:text-emerald-400"
      : tone === "red"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";

  const outcomeToneClass = (o?: Outcome | null) =>
    isYes(o)
      ? "text-emerald-500 dark:text-emerald-400"
      : isNo(o)
        ? "text-red-500 dark:text-red-400"
        : "text-foreground";

  const yesOutcomeStats = $derived(
    outcomes.find((o: any) => /^(yes|true)$/i.test(o?.label ?? o?.name ?? "")),
  );

  const yesPct = $derived(
    yesOutcomeStats ? Math.round(priceOf(yesOutcomeStats)) : null,
  );

  const noPct = $derived(noOutcome ? Math.round(priceOf(noOutcome)) : null);

  const winningOutcome = $derived.by(() => {
    const winnerId =
      market.winning_outcome_id ??
      market.winner_outcome_id ??
      market.settlement_outcome_id ??
      market.settlement?.outcome_id ??
      market.winning_outcome?.id ??
      null;

    if (winnerId) {
      const byId = outcomes.find((o: Outcome) => o.id === String(winnerId));
      if (byId) return byId;
    }

    return (
      outcomes.find((o: Outcome) =>
        ["winner", "winning", "won", "correct"].includes(
          String(o.status ?? "").toLowerCase(),
        ),
      ) ??
      (market.winning_outcome_label || market.settlement?.outcome_label
        ? ({
            id: winnerId ?? "settlement-outcome",
            label: market.winning_outcome_label ?? market.settlement?.outcome_label,
          } as Outcome)
        : null)
    );
  });

  const rawMarketBets = $derived((data.marketBets ?? []) as MarketBet[]);

  const marketPositions: MarketPosition[] = $derived.by(() =>
    rawMarketBets.map((bet, idx) => {
      const prediction = String(bet.prediction ?? "yes").toLowerCase() === "no"
        ? "no"
        : "yes";
      const result = toResultKind(bet.result);
      const marketStatus = String(
        bet.market_status ?? market.status ?? "open",
      ).toLowerCase();
      const status =
        result === "correct" || result === "incorrect"
          ? "settled"
          : marketStatus === "closed" || marketStatus === "settled"
            ? (marketStatus as "closed" | "settled")
            : "open";
      const stakeCents = bet.stake_cents ?? 0;
      const payoutCents =
        bet.settled_payout_cents ??
        (result === "incorrect" ? 0 : bet.anticipated_payout_cents ?? null);
      const possibleGainCents =
        payoutCents != null ? payoutCents - stakeCents : null;
      const outcomeLabel =
        result === "correct"
          ? "Won"
          : result === "incorrect"
            ? "Lost"
            : status === "closed"
              ? "Awaiting settlement"
              : "Potential earnings";
      const outcomeCents =
        result === "incorrect"
          ? stakeCents
          : result === "correct" || result === "pending"
            ? possibleGainCents
            : payoutCents;
      const outcomeTone =
        result === "correct"
          ? "green"
          : result === "incorrect"
            ? "red"
            : (outcomeCents ?? 0) > 0
              ? "green"
              : (outcomeCents ?? 0) < 0
                ? "red"
                : "neutral";

      return {
        id: String(bet.bet_id ?? bet.id ?? idx),
        prediction,
        result,
        status,
        stakeCents,
        payoutCents,
        payoutLabel:
          bet.settled_payout_cents != null || result === "incorrect"
            ? "Paid out"
            : "Anticipated payout",
        outcomeLabel,
        outcomeCents,
        outcomeTone,
        date: formatDate(bet.created_at),
      };
    }),
  );

  const marketPositionTotals = $derived.by(() => {
    const stakeCents = marketPositions.reduce(
      (sum, p) => sum + p.stakeCents,
      0,
    );
    const payoutCents = marketPositions.reduce(
      (sum, p) => sum + (p.payoutCents ?? 0),
      0,
    );
    const hasKnownPayout = marketPositions.some((p) => p.payoutCents != null);

    return {
      stakeCents,
      payoutCents,
      gainCents: hasKnownPayout ? payoutCents - stakeCents : null,
      count: marketPositions.length,
      hasKnownPayout,
    };
  });

  const chartChancePct = $derived(chartSide === "yes" ? yesPct : noPct);

  const chartSideLabel = $derived(chartSide === "yes" ? "Yes" : "No");

  const chartToneClass = $derived(
    chartSide === "yes"
      ? "text-emerald-500 dark:text-emerald-400"
      : "text-red-500 dark:text-red-400",
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
    if (!browser) return;

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
  };

  const fetchPriceHistory = async () => {
    if (!browser) return;

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
    hasVolume ? `${formatCompactKES(volumeKES)} Vol.` : "- Vol.",
  );

  const projectedEndLabel = $derived(
    projectedEndDate ? `Ends ${projectedEndDate}` : "Ends -",
  );

  let chartEl = $state<HTMLDivElement | null>(null);
  let chart: IChartApi | null = null;
  let hasFitContent = false;
  let series: ISeriesApi<"Area"> | null = null;
  let resizeTimeout: ReturnType<typeof setTimeout>;
  let chartPulse = $state(false);

  const pulseChart = () => {
    if (!browser) return;

    chartPulse = false;
    window.requestAnimationFrame(() => {
      chartPulse = true;
      window.setTimeout(() => {
        chartPulse = false;
      }, 700);
    });
  };

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

  const noHistory = $derived(
    priceHistory?.outcomes?.find((o: any) =>
      /^(no|false)$/i.test(o.label ?? ""),
    ),
  );

  const activeHistoryPoints = $derived.by(() => {
    if (chartSide === "yes") return yesHistory?.points ?? [];
    if (noHistory?.points?.length) return noHistory.points;

    return (yesHistory?.points ?? []).map((p: any) => ({
      ...p,
      price_cents: 100 - Number(p.price_cents ?? 0),
    }));
  });

  const deltaPct = $derived(
    activeHistoryPoints?.length
      ? activeHistoryPoints.length < 2
        ? 0
        : Math.round(
            activeHistoryPoints[activeHistoryPoints.length - 1].price_cents -
              activeHistoryPoints[activeHistoryPoints.length - 2].price_cents,
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

    return filtered;
  };

  function buildChartData() {
    if (!activeHistoryPoints?.length) return [];

    const mapped = filterByRange(activeHistoryPoints, selectedRange)
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

    series.applyOptions(
      chartSide === "yes"
        ? {
            lineColor: "#2dd4bf",
            topColor: "rgba(45,212,191,0.35)",
            bottomColor: "rgba(45,212,191,0.02)",
          }
        : {
            lineColor: "#ff4d4f",
            topColor: "rgba(255,77,79,0.28)",
            bottomColor: "rgba(255,77,79,0.02)",
          },
    );
    series.setData(data);
    pulseChart();

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

      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${Math.round(price)}%`,
      },
    });
    updateChart();
    chart.timeScale().fitContent();
    resizeChart();
    if (browser) {
      window.addEventListener("resize", resizeChart);
    }
  });

  const isTradable = $derived((market.status ?? "").toLowerCase() === "open");

  const selectChartSide = (side: "yes" | "no") => {
    setActiveSide(side);
  };
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
<AppHeader {isAuthed} />
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
      <div class={`text-3xl font-semibold ${chartToneClass}`}>
        {chartChancePct !== null
          ? `${chartChancePct}% ${chartSideLabel} chance`
          : "-"}
      </div>
      <!-- Placeholder uptick -->
      {#if deltaPct !== null}
        <div class={`flex items-center gap-1 text-sm font-medium ${chartToneClass}`}>
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
          class="overflow-hidden rounded-xl border border-border/50 bg-card text-sm font-medium"
        >
          <div class="px-3 pb-3 pt-3 md:px-4 md:pb-4">
            <!-- Range selector -->
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div class="flex rounded-lg border border-border bg-background/50 p-1">
                <button
                  class={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    chartSide === "yes"
                      ? "bg-emerald-500/15 text-emerald-500 dark:text-emerald-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onclick={() => selectChartSide("yes")}
                >
                  Yes {yesPct ?? "-"}%
                </button>
                <button
                  class={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    chartSide === "no"
                      ? "bg-red-500/15 text-red-500 dark:text-red-400"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onclick={() => selectChartSide("no")}
                >
                  No {noPct ?? "-"}%
                </button>
              </div>

              <div class="flex gap-2">
                {#each ["1H", "1D", "1W", "1M", "ALL"] as r (r)}
                  <button
                    class={`px-2 py-1 text-xs rounded-md border ${
                      selectedRange === r
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground"
                    }`}
                    onclick={() => {
                      selectedRange = r as typeof selectedRange;
                      hasFitContent = false;
                      updateChart();
                    }}
                  >
                    {r}
                  </button>
                {/each}
              </div>
            </div>
            <div
              class={`market-chart-shell h-[240px] rounded-lg bg-background/40 p-2 sm:h-[260px] md:h-[300px] md:p-3 ${
                chartPulse ? "market-chart-shell-pulse" : ""
              }`}
            >
              <div class="relative h-full w-full overflow-hidden">
                <div bind:this={chartEl} class="w-full h-full"></div>

                {#if !hasChartData}
                  <div
                    class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground"
                  >
                    <span class="text-center">
                      No chart data yet for {chartSideLabel}.<br />
                      The line will update as predictions are placed.
                    </span>
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
      <aside class="hidden md:block md:col-span-1">
        <form
          method="POST"
          action="?/buy"
          class="rounded-xl border border-border bg-card overflow-hidden"
          use:enhance={({ cancel }) => {
            if (isSubmitting) {
              cancel();
              return;
            }

            isSubmitting = true;

            return async ({ result }: { result: any }) => {
              isSubmitting = false;

              if (result?.type === "success") {
                const balanceCents = result.data?.wallet_balance_cents;

                if (typeof balanceCents === "number") {
                  portfolio.set(balanceCents / 100);
                }
              }

              await fetchMarket();
              await fetchPriceHistory();
            };
          }}
        >
          <div
            class="p-4 border-b border-border/60 text-sm font-medium flex items-center justify-between"
          >
            <span>Buy</span>
            {#if selectedOutcome}
              <span class={`text-xs font-semibold ${selectedSideToneClass}`}>
                {selectedSideLabel} {selectedPricePercent}%
              </span>
            {/if}
          </div>

          <!-- hidden fields that go to the buy action -->
          <input type="hidden" name="side" value={selectedSide} />
          <input
            type="hidden"
            name="amount_cents"
            value={Math.round(Number(amountKES || 0) * 100)}
          />

          <div class="p-4 space-y-5">
            {#if outcomes.length}
              {#if !isTradable}
                <div class="space-y-3">
                  <div
                    class={`rounded-lg border p-4 ${statusMeta(market).cls}`}
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <div class="text-sm font-semibold">
                          Market {statusMeta(market).label.toLowerCase()}
                        </div>
                        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Trading is closed. You can still review the market
                          chart, context, and final position here.
                        </p>
                        {#if projectedEndDate}
                          <p class="mt-2 text-xs text-muted-foreground">
                            Closed on {projectedEndDate}
                          </p>
                        {/if}
                      </div>
                      <span
                        class={`shrink-0 rounded-md border px-2 py-1 text-[11px] font-semibold ${statusMeta(market).cls}`}
                      >
                        {statusMeta(market).label}
                      </span>
                    </div>
                  </div>

                  <div
                    class="rounded-lg border border-border/70 bg-background/40 p-4"
                  >
                    <p class="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Winning outcome
                    </p>
                    <p
                      class={`mt-1 text-lg font-semibold ${outcomeToneClass(winningOutcome)}`}
                    >
                      {winningOutcome
                        ? outcomeLabelOf(winningOutcome)
                        : "Not set yet"}
                    </p>
                    <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {winningOutcome
                        ? "This is the final result for this market."
                        : "This market is closed but has not been settled yet."}
                    </p>
                  </div>

                  <div
                    class="rounded-lg border border-border/70 bg-background/40 p-4"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold">Your position</p>
                        <p class="mt-1 text-xs text-muted-foreground">
                          {#if !isAuthed}
                            Log in to see what you placed on this market.
                          {:else if marketPositions.length === 0}
                            You did not place a prediction on this market.
                          {:else}
                            {marketPositionTotals.count}
                            {marketPositionTotals.count === 1
                              ? "prediction"
                              : "predictions"}
                            on this market.
                          {/if}
                        </p>
                      </div>

                      {#if marketPositions.length > 0}
                        <div class="text-right">
                          <p class="text-[11px] text-muted-foreground">
                            Amount placed
                          </p>
                          <p class="text-sm font-semibold">
                            {formatCents(marketPositionTotals.stakeCents)}
                          </p>
                        </div>
                      {/if}
                    </div>

                    {#if marketPositions.length > 0}
                      <div class="mt-4 border-t border-border/60 pt-3">
                        <div class="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p class="text-[11px] text-muted-foreground">
                              Paid/expected
                            </p>
                            <p class="mt-1 font-semibold">
                              {marketPositionTotals.hasKnownPayout
                                ? formatCents(marketPositionTotals.payoutCents)
                                : "Pending"}
                            </p>
                          </div>
                          <div class="text-right">
                            <p class="text-[11px] text-muted-foreground">
                              Result
                            </p>
                            <p
                              class={`mt-1 font-semibold ${positionToneClass(
                                (marketPositionTotals.gainCents ?? 0) > 0
                                  ? "green"
                                  : (marketPositionTotals.gainCents ?? 0) < 0
                                    ? "red"
                                    : "neutral",
                              )}`}
                            >
                              {marketPositionTotals.gainCents == null
                                ? "Pending"
                                : `${marketPositionTotals.gainCents >= 0 ? "+" : "-"}${formatCents(
                                    Math.abs(marketPositionTotals.gainCents),
                                  )}`}
                            </p>
                          </div>
                        </div>

                        <div class="mt-4 space-y-2">
                          {#each marketPositions as position}
                            <div
                              class="rounded-md border border-border/60 bg-card/50 p-3 text-sm"
                            >
                              <div class="flex items-start justify-between gap-3">
                                <div>
                                  <p class="font-semibold">
                                    Picked {position.prediction === "yes"
                                      ? "Yes"
                                      : "No"}
                                  </p>
                                  <p class="mt-1 text-[11px] text-muted-foreground">
                                    Placed {position.date}
                                  </p>
                                </div>
                                <div class="text-right">
                                  <p
                                    class={`font-semibold ${positionToneClass(
                                      position.outcomeTone,
                                    )}`}
                                  >
                                    {position.outcomeCents == null
                                      ? "Pending"
                                      : position.outcomeLabel === "Lost"
                                        ? formatCents(position.outcomeCents)
                                        : `${position.outcomeCents >= 0 ? "+" : "-"}${formatCents(Math.abs(position.outcomeCents))}`}
                                  </p>
                                  <p class="mt-1 text-[11px] text-muted-foreground">
                                    {position.payoutLabel}:
                                    {formatCents(position.payoutCents)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                </div>
              {:else}
              <!-- YES / NO toggle row -->
              <div class="grid grid-cols-2 gap-2">
                {#if yesOutcome}
                  <button
                    type="button"
                    disabled={!isTradable}
                    class={`btn flex flex-col items-center justify-center text-sm
                      ${
                        selectedOutcome === yesOutcome ? "btn-yes" : "bg-card border-border"
                      }
                      ${!isTradable ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                    onclick={() => isTradable && selectOutcome(yesOutcome)}
                  >
                    <span>Yes</span>
                    <span class="mt-0.5 text-[11px] opacity-80">
                      {Math.round(priceOf(yesOutcome))}%
                    </span>
                  </button>
                {/if}

                {#if noOutcome}
                  <button
                    type="button"
                    disabled={!isTradable}
                    class={`btn flex flex-col items-center justify-center text-sm
                    ${
                      selectedOutcome === noOutcome ? "btn-no" : "bg-card border-border"
                    }
                    ${!isTradable ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                    onclick={() => isTradable && selectOutcome(noOutcome)}
                  >
                    <span>No</span>
                    <span class="mt-0.5 text-[11px] opacity-80">
                      {Math.round(priceOf(noOutcome))}%
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
                    const raw = e.currentTarget.value;

                    // keep only digits
                    const digits = raw.replace(/\D/g, "");

                    if (digits === "") {
                      amountKES = "";
                      return;
                    }

                    amountKES = Math.max(0, Number(digits));
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
                <div
                  class="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3"
                >
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-[11px] text-muted-foreground">
                        Amount placed
                      </p>
                      <p class="mt-1 font-semibold">
                        {formatKES(totalKES)}
                      </p>
                    </div>

                    <div class="text-right">
                      <p class="text-[11px] text-muted-foreground">
                        Market price
                      </p>
                      <p class="mt-1 font-semibold">
                        {selectedSideLabel} {selectedPricePercent}%
                      </p>
                    </div>
                  </div>

                  <div class="border-t border-border/60 pt-3">
                    <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                      <div>
                        <p class="text-xs text-muted-foreground">
                          If {selectedSideLabel} wins
                        </p>
                        <p class="mt-1 text-[11px] text-muted-foreground">
                          Includes your {formatKES(totalKES)} placed
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-[11px] text-muted-foreground">
                          Could receive
                        </p>
                        <p
                          class="mt-1 text-2xl md:text-3xl font-semibold text-emerald-500 dark:text-emerald-400"
                        >
                          {formatKES(potentialPayoutKES)}
                        </p>
                      </div>
                    </div>

                    <div class="mt-3 flex items-center justify-between gap-3">
                      <span class="text-xs text-muted-foreground">
                        Possible gain
                      </span>
                      <span class={`text-sm font-semibold ${profitToneClass}`}>
                        {profitKES >= 0 ? "+" : "-"}{formatKES(Math.abs(profitKES))}
                      </span>
                    </div>
                  </div>

                  <div
                    class="text-[11px] leading-relaxed text-muted-foreground"
                  >
                    Estimated using current market pools. Final payout may
                    change as more predictions are placed.
                  </div>
                </div>
              {/if}
              <!-- Submit -->
              <button
                type="submit"
                class="w-full rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
                  flex items-center justify-center gap-2"
                disabled={Number(amountKES || 0) <= 0 || isSubmitting}
              >
                {#if isSubmitting}
                  <span class="flex items-center gap-2">
                    <span class="action-spinner"></span>
                    Placing...
                  </span>
                {:else}
                  Place order - {formatKES(Number(amountKES || 0))}
                {/if}
              </button>
              {/if}
            {:else}
              <div class="text-xs text-muted-foreground">No outcomes yet.</div>
            {/if}
          </div>
        </form>
      </aside>
    </div>
  </div>
  <!-- MOBILE BUY BAR (fixed above bottom nav) -->
  {#if outcomes.length && isTradable}
    <div
      class="fixed bottom-16 left-0 right-0 z-40 md:hidden
    border-t border-border bg-background/95 backdrop-blur px-4 py-3"
    >
      <div class="flex gap-2">
        <!-- YES -->
        {#if yesOutcome}
          <button
            class="flex-1 rounded-lg border py-3 text-sm font-semibold shadow-lg transition-all duration-150 active:scale-[0.98]
          {selectedOutcome === yesOutcome
              ? 'border-emerald-400/60 bg-emerald-600 text-white shadow-emerald-900/40'
              : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300 shadow-black/20'}"
            onclick={() => {
              selectOutcome(yesOutcome);
              showMobileBuy = true;
            }}
          >
            Buy Yes at {Math.round(priceOf(yesOutcome))}%
          </button>
        {/if}

        <!-- NO -->
        {#if noOutcome}
          <button
            class="flex-1 rounded-lg border py-3 text-sm font-semibold shadow-lg transition-all duration-150 active:scale-[0.98]
          {selectedOutcome === noOutcome
              ? 'border-red-400/60 bg-red-600 text-white shadow-red-950/50'
              : 'border-red-500/30 bg-red-500/15 text-red-300 shadow-black/20'}"
            onclick={() => {
              selectOutcome(noOutcome);
              showMobileBuy = true;
            }}
          >
            Buy No at {Math.round(priceOf(noOutcome))}%
          </button>
        {/if}
      </div>
    </div>
  {/if}
</main>
{#if showMobileBuy && isTradable}
  <div class="fixed inset-0 z-50 md:hidden">
    <!-- backdrop -->
    <button
      type="button"
      aria-label="Close buy panel"
      class="absolute inset-0 bg-black/50 cursor-default"
      onclick={() => (showMobileBuy = false)}
    ></button>

    <!-- drawer -->
    <div
      class="absolute bottom-0 left-0 right-0
      bg-background border-t border-border rounded-t-2xl
      p-4 space-y-4 animate-slide-up"
    >
      <!-- header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold">Place your prediction</div>
          {#if selectedOutcome}
            <div class="mt-1 text-xs text-muted-foreground">
              Buying {selectedSideLabel} at {selectedPricePercent}%
            </div>
          {/if}
        </div>
        <button
          class="text-xs text-muted-foreground"
          onclick={() => (showMobileBuy = false)}
        >
          Close
        </button>
      </div>

      <!-- selected outcome -->
      {#if selectedOutcome}
        <div class="line-clamp-2 text-sm font-medium leading-snug">
          {market.title}
        </div>
        <div class="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-border/70 bg-card p-3">
          <div>
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">
              Your pick
            </div>
            <div class="mt-1 text-sm text-muted-foreground">
              If {selectedSideLabel} wins, your payout follows the current market pool.
            </div>
          </div>

          <div
            class={`rounded-lg border px-4 py-2 text-sm font-semibold
      ${
        selectedSide === "yes"
          ? "border-emerald-400/50 bg-emerald-600 text-white shadow-lg shadow-emerald-950/40"
          : "border-red-400/50 bg-red-600 text-white shadow-lg shadow-red-950/50"
      }`}
          >
            {selectedSideLabel}
          </div>
        </div>
      {/if}

      <!-- amount input -->
      <input
        type="text"
        inputmode="numeric"
        placeholder="0"
        class="w-full text-center text-3xl font-semibold bg-transparent outline-none"
        bind:value={amountKES}
        onfocus={() => {
          if (Number(amountKES || 0) === 0) amountKES = "";
        }}
        onblur={() => {
          if (amountKES === "") amountKES = 0;
        }}
        oninput={(e) => {
          const digits = e.currentTarget.value.replace(/\D/g, "");
          amountKES = digits === "" ? "" : Number(digits);
        }}
      />

      <!-- payout -->
      {#if Number(amountKES || 0) > 0}
        <div
          class="space-y-3 rounded-lg border border-border/70 bg-card p-3"
        >
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[11px] text-muted-foreground">Amount placed</p>
              <p class="mt-1 font-semibold">{formatKES(totalKES)}</p>
            </div>

            <div class="text-right">
              <p class="text-[11px] text-muted-foreground">Possible gain</p>
              <p class={`mt-1 font-semibold ${profitToneClass}`}>
                {profitKES >= 0 ? "+" : "-"}{formatKES(Math.abs(profitKES))}
              </p>
            </div>
          </div>

          <div class="border-t border-border/60 pt-3">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs text-muted-foreground">
                  If {selectedSideLabel} wins
                </p>
                <p class="mt-1 text-[11px] text-muted-foreground">
                  Includes your amount placed
                </p>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-muted-foreground">Could receive</p>
                <p class="mt-1 text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
                  {formatKES(potentialPayoutKES)}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <!-- quick amounts -->
      <div class="flex gap-2 justify-center">
        {#each [50, 100, 500, 1000] as amt}
          <button
            class="rounded-md border border-border bg-input px-3 py-1.5 text-xs font-medium transition-all active:scale-95"
            onclick={() => (amountKES = amt)}
          >
            KES {amt}
          </button>
        {/each}
      </div>

      <!-- submit -->
      <form
        method="POST"
        action="?/buy"
        use:enhance={({ cancel }) => {
          if (isSubmitting) {
            cancel();
            return;
          }

          isSubmitting = true;

          return async ({ result }: { result: any }) => {
            isSubmitting = false;
            showMobileBuy = false;

            if (result?.type === "success") {
              const balanceCents = result.data?.wallet_balance_cents;

              if (typeof balanceCents === "number") {
                portfolio.set(balanceCents / 100);
              }
            }

            await fetchMarket();
            await fetchPriceHistory();
          };
        }}
      >
        <input type="hidden" name="side" value={selectedSide} />
        <input
          type="hidden"
          name="amount_cents"
          value={Math.round(Number(amountKES || 0) * 100)}
        />
        <input
          type="hidden"
          name="price_cents"
          value={Math.round(pricePerShare * 100)}
        />

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
          disabled={Number(amountKES || 0) <= 0 || isSubmitting}
        >
          {#if isSubmitting}<span class="action-spinner"></span>{/if}
          {isSubmitting
            ? "Placing..."
            : `Place order - ${formatKES(Number(amountKES || 0))}`}
        </button>
      </form>
    </div>
  </div>
{/if}
