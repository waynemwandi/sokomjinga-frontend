<!-- src/routes/(app)/admin/dashboard/+page.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    createChart,
    type IChartApi,
    type ISeriesApi,
    type Time,
  } from "lightweight-charts";

  export let data: {
    stats: {
      total_users: number;
      signups_last_7d: number;
      logins_today: number;
      logins_last_7d: number;
      logins_by_provider: Record<string, number>;
    } | null;
    authSeries: {
      days: number;
      points: { date: string; logins: number }[];
    } | null;
  };

  // -----------------------
  // Stats cards
  // -----------------------
  const s = data.stats;

  const cards = s
    ? [
        {
          title: "Total Users",
          value: s.total_users.toLocaleString(),
          delta: "",
        },
        {
          title: "Signups (last 7 days)",
          value: s.signups_last_7d.toLocaleString(),
          delta: "",
        },
        {
          title: "Logins Today",
          value: s.logins_today.toLocaleString(),
          delta: "",
        },
        {
          title: "Logins (last 7 days)",
          value: s.logins_last_7d.toLocaleString(),
          delta: "",
        },
      ]
    : [
        { title: "Total Users", value: "—", delta: "" },
        { title: "Signups (last 7 days)", value: "—", delta: "" },
        { title: "Logins Today", value: "—", delta: "" },
        { title: "Logins (last 7 days)", value: "—", delta: "" },
      ];

  // -----------------------
  // Provider table
  // -----------------------
  const providers = s?.logins_by_provider
    ? Object.entries(s.logins_by_provider)
        .map(([provider, count]) => ({ provider, count }))
        .sort((a, b) => b.count - a.count)
    : [];

  // -----------------------
  // Auth time-series → chart
  // -----------------------
  let chartEl: HTMLDivElement | null = null;
  let chart: IChartApi | null = null;
  let lineSeries: ISeriesApi<"Line"> | null = null;

  const chartData =
    data.authSeries?.points.map((p) => ({
      time: p.date as Time, // YYYY-MM-DD
      value: p.logins,
    })) ?? [];

  onMount(() => {
    if (!chartEl || chartData.length === 0) return;

    chart = createChart(chartEl, {
      height: 200,
      layout: {
        background: { color: "transparent" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0,
      },
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
    });

    lineSeries = chart.addLineSeries({
      color: "#22c55e",
      lineWidth: 2,
    });

    lineSeries.setData(chartData);
    chart.timeScale().fitContent();
  });

  onDestroy(() => {
    chart?.remove();
    chart = null;
  });
</script>

<h1 class="text-xl font-semibold mb-4">Dashboard</h1>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {#each cards as c}
    <div
      class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
    >
      <div class="text-xs text-neutral">{c.title}</div>
      <div class="mt-2 flex items-baseline gap-2">
        <div class="text-2xl font-semibold">{c.value}</div>
        {#if c.delta}
          <div class="text-xs text-neutral">{c.delta}</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<div class="mt-6 rounded-xl border border-neutral bg-neutral p-4">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-base font-semibold tracking-tight">
      Logins over last {data.authSeries?.days ?? 0} days
    </h2>

    <span class="text-xs text-neutral/60"> Daily activity </span>
  </div>

  {#if chartData.length === 0}
    <div class="h-40 flex items-center justify-center text-sm text-neutral">
      No activity yet
    </div>
  {:else}
    <div bind:this={chartEl} class="h-48 w-full"></div>
  {/if}
</div>

<div class="mt-6 rounded-xl border border-neutral bg-neutral p-5">
  <!-- Section header -->
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-base font-semibold tracking-tight">Login methods</h2>
    <span class="text-xs text-neutral/60"> All-time </span>
  </div>

  <!-- Content -->
  {#if providers.length === 0}
    <div class="text-sm text-neutral">No login data available.</div>
  {:else}
    <div class="space-y-3">
      {#each providers as row}
        <div
          class="flex items-center justify-between rounded-lg border border-neutral/60 px-4 py-3"
        >
          <div class="flex flex-col">
            <span class="text-sm font-medium capitalize">
              {row.provider || "unknown"}
            </span>
            <span class="text-xs text-neutral/60"> Auth provider </span>
          </div>

          <div class="text-right">
            <div class="text-lg font-semibold">
              {row.count}
            </div>
            <div class="text-xs text-neutral/60">logins</div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
