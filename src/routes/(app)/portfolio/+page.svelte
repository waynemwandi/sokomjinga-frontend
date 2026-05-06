<!-- src/routes/(app)/portfolio/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import {
    TrendingUp,
    ListChecks,
    Heart,
    Timer,
  } from "lucide-svelte";

  export let data: PageData & {
    wallet?: {
      balance_cents?: number;
    };
    positions?: PositionsResponse;
  };
  // Shape for /me/stats response (current backend)
  type StatsResponse = {
    total_predictions?: number;
    correct?: number;
    incorrect?: number;
    accuracy?: number; // 0–1 or 0–100
    new_predictions_this_month?: number;
    correct_this_week?: number;
    incorrect_this_week?: number;
  };

  // Shape for /me/bets response (flat, not nested market)
  type Bet = {
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

  type ResultKind = "correct" | "incorrect" | "pending";
  type PositionStatus = "open" | "closed" | "settled";
  type PositionFilter = "all" | PositionStatus;

  type PositionItem = {
    stake_cents?: number;
    possible_payout_cents?: number;
    possible_gain_cents?: number;
  };

  type PositionsResponse = {
    positions?: PositionItem[];
    totals?: {
      count?: number;
      stake_cents?: number;
      possible_payout_cents?: number;
      possible_gain_cents?: number;
      current_value_cents?: number;
      unrealized_pnl_cents?: number;
    };
  };

  // ----- STATS NORMALIZATION -----
  const backendStats: StatsResponse = (data as any).stats ?? {};

  const total = backendStats.total_predictions ?? 0;
  const correct = backendStats.correct ?? 0;
  const incorrect = backendStats.incorrect ?? 0;
  const pending = Math.max(0, total - correct - incorrect);

  let accuracyValue: number | null = null;
  if (typeof backendStats.accuracy === "number") {
    // backend might send 0–1 or 0–100
    accuracyValue =
      backendStats.accuracy <= 1
        ? backendStats.accuracy * 100
        : backendStats.accuracy;
  } else if (total > 0) {
    accuracyValue = (correct / total) * 100;
  }

  const stats = [
    {
      icon: "accuracy",
      label: "Accuracy",
      value: accuracyValue !== null ? `${accuracyValue.toFixed(0)}%` : "–",
      subtext:
        total > 0
          ? `${correct} out of ${total} predictions`
          : "No predictions yet",
      highlight: "green",
    },
    {
      icon: "total",
      label: "Total Predictions",
      value: String(total),
      subtext:
        backendStats.new_predictions_this_month != null
          ? `+${backendStats.new_predictions_this_month} this month`
          : "",
      highlight: "neutral",
    },
    {
      icon: "correct",
      label: "Correct",
      value: String(correct),
      subtext:
        backendStats.correct_this_week != null
          ? `+${backendStats.correct_this_week} this week`
          : "",
      highlight: "green",
    },
    {
      icon: "incorrect",
      label: "Incorrect",
      value: String(incorrect),
      subtext:
        backendStats.incorrect_this_week != null
          ? `+${backendStats.incorrect_this_week} this week`
          : "",
      highlight: "red",
    },
  ] as const;

  const toResultKind = (status?: string): ResultKind => {
    const s = (status || "").toLowerCase();
    if (s === "won" || s === "correct") return "correct";
    if (s === "lost" || s === "incorrect") return "incorrect";
    return "pending";
  };

  const formatDate = (d?: string) => {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (d?: string | null) => {
    if (!d) return null;
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  type PredictionItem = {
    id: string;
    marketId: string;
    title: string;
    category: string;
    marketStatus: string;
    prediction: "yes" | "no";
    result: ResultKind;
    status: PositionStatus;
    date: string;
    closeDate: string | null;
    closeLabel: string;
    stakeCents: number;
    payoutLabel: string;
    payoutCents: number | null;
    outcomeLabel: string;
    outcomeCents: number | null;
    outcomeTone: "green" | "red" | "neutral";
    yesPercentage: number;
    noPercentage: number;
  };

  const rawBets: Bet[] = (data as any).bets ?? [];

  // ----- BETS → UI PREDICTIONS -----
  const predictions: PredictionItem[] = rawBets.map((b, idx) => {
    const title = b.title ?? "Untitled market";
    const category = b.category ?? "General";

    const rawYes = b.yes_percentage ?? 0;
    const rawNo =
      b.no_percentage != null ? b.no_percentage : 100 - (rawYes || 0);

    const yesPercentage = Math.max(0, Math.min(100, Math.round(rawYes ?? 0)));
    const noPercentage = Math.max(0, Math.min(100, Math.round(rawNo ?? 0)));

    const predictionStr = (b.prediction || "yes").toLowerCase();
    const prediction: "yes" | "no" = predictionStr === "no" ? "no" : "yes";
    const result = toResultKind(b.result);
    const marketStatus = (b.market_status ?? "open").toLowerCase();
    const status: PositionStatus =
      result === "correct" || result === "incorrect"
        ? "settled"
        : marketStatus === "closed"
          ? "closed"
          : "open";
    const payoutCents =
      b.settled_payout_cents ??
      (result === "incorrect" ? 0 : b.anticipated_payout_cents ?? null);
    const possibleGainCents =
      payoutCents != null ? payoutCents - (b.stake_cents ?? 0) : null;
    const outcomeLabel =
      result === "correct"
        ? "Won"
        : result === "incorrect"
          ? "Lost"
          : "Potential earnings";
    const outcomeCents =
      result === "incorrect"
        ? b.stake_cents ?? 0
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
      id: String(b.bet_id ?? b.id ?? idx),
      marketId: String(b.market_id ?? ""),
      title,
      category,
      marketStatus,
      prediction,
      result,
      status,
      date: formatDate(b.created_at),
      closeDate: formatShortDate(b.close_at ?? b.projected_end_date ?? null),
      closeLabel:
        marketStatus === "open"
          ? "Closes on"
          : "Closed on",
      stakeCents: b.stake_cents ?? 0,
      payoutLabel:
        b.settled_payout_cents != null ||
        result === "incorrect"
          ? "Paid out"
          : "Anticipated payout",
      payoutCents,
      outcomeLabel,
      outcomeCents,
      outcomeTone,
      yesPercentage,
      noPercentage,
    };
  });

  const resultLabel = (r: ResultKind) =>
    r === "pending" ? "Pending" : r.charAt(0).toUpperCase() + r.slice(1);

  const positionsData: PositionsResponse = (data as any).positions ?? {};
  const openPositions = Array.isArray(positionsData.positions)
    ? positionsData.positions
    : [];

  const sumCents = (items: PositionItem[], key: keyof PositionItem): number =>
    items.reduce((sum, item) => {
      const value = item[key];
      return sum + (typeof value === "number" ? value : 0);
    }, 0);

  const possiblePayoutCents =
    positionsData.totals?.possible_payout_cents ??
    positionsData.totals?.current_value_cents ??
    sumCents(openPositions, "possible_payout_cents");

  const openStakeCents =
    positionsData.totals?.stake_cents ?? sumCents(openPositions, "stake_cents");

  const possibleGainCents =
    positionsData.totals?.possible_gain_cents ??
    positionsData.totals?.unrealized_pnl_cents ??
    sumCents(openPositions, "possible_gain_cents");

  const activePositionCount =
    positionsData.totals?.count ?? openPositions.length;

  const possibleGainClass =
    possibleGainCents > 0
      ? "text-emerald-400"
      : possibleGainCents < 0
        ? "text-red-400"
        : "text-muted-foreground";

  const availableBalanceCents = data.wallet?.balance_cents ?? 0;
  const totalWalletCents = availableBalanceCents + openStakeCents;

  let visibleBets = 3;
  const LOAD_STEP = 3;
  let positionFilter: PositionFilter = "all";

  const statusLabel = (s: PositionStatus) =>
    s === "open" ? "Open" : s === "closed" ? "Closed" : "Settled";

  $: positionFilters = [
    { key: "all" as const, label: "All positions", count: predictions.length },
    {
      key: "open" as const,
      label: "Open",
      count: predictions.filter((p) => p.status === "open").length,
    },
    {
      key: "closed" as const,
      label: "Closed",
      count: predictions.filter((p) => p.status === "closed").length,
    },
    {
      key: "settled" as const,
      label: "Settled",
      count: predictions.filter((p) => p.status === "settled").length,
    },
  ];

  $: filteredPredictions =
    positionFilter === "all"
      ? predictions
      : predictions.filter((p) => p.status === positionFilter);

  $: {
    positionFilter;
    visibleBets = LOAD_STEP;
  }

  $: visiblePredictions = filteredPredictions.slice(0, visibleBets);

  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)}`;

  const formatSignedKES = (cents: number) => {
    const value = cents / 100;
    if (value === 0) return formatKES(0);
    return `${value > 0 ? "+" : "-"}${formatKES(Math.abs(value))}`;
  };

  const moneyToneClass = (tone: "green" | "red" | "neutral") =>
    tone === "green"
      ? "text-emerald-500 dark:text-emerald-400"
      : tone === "red"
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground";
</script>

<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6 space-y-6">
  <!-- Header -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-2">
    <div class="mx-auto w-full max-w-5xl space-y-1">
      <h1 class="text-2xl md:text-3xl font-semibold">Portfolio</h1>
      <p class="text-sm text-muted-foreground">
        View your wallet balance, open positions and prediction history.
      </p>
    </div>
  </section>

  <!-- Wallet overview -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-4">
    <div class="mx-auto w-full max-w-5xl">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div
          class="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-2"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-medium text-muted-foreground">
                Available cash
              </p>
              <p class="mt-2 text-3xl md:text-4xl font-semibold">
                {formatKES(availableBalanceCents / 100)}
              </p>
            </div>

            <span
              class="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
            >
              Active
            </span>
          </div>

          <div
            class="mt-6 rounded-lg border border-border/70 bg-background/40 p-3"
          >
            <p class="text-[11px] text-muted-foreground">
              Cash + amount placed
            </p>
            <p class="mt-1 text-lg font-semibold">
              {formatKES(totalWalletCents / 100)}
            </p>
          </div>

          <div class="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onclick={() => goto("/portfolio?deposit=1")}
              class="flex-1 rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition duration-200 hover:-translate-y-0.5 hover:opacity-90 hover:shadow-md active:translate-y-0"
            >
              Deposit cash
            </button>
            <button
              type="button"
              class="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-950 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-zinc-50 hover:shadow-md active:translate-y-0 disabled:opacity-70 dark:border-border dark:bg-input dark:text-foreground dark:hover:bg-muted"
              disabled
              aria-disabled="true"
              title="Withdrawals coming soon"
            >
              Withdraw (soon)
            </button>
          </div>
        </div>

        <div
          class="rounded-xl border border-border bg-card p-5 shadow-sm lg:col-span-3"
        >
          <div
            class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div>
              <p class="text-xs font-medium text-muted-foreground">
                Active predictions
              </p>
              <p class="mt-2 text-3xl md:text-4xl font-semibold">
                {formatKES(openStakeCents / 100)}
              </p>
            </div>

            <div
              class="inline-flex w-fit items-center rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span class="font-medium text-foreground">
                {activePositionCount}
              </span>
              <span class="ml-1">
                open {activePositionCount === 1 ? "position" : "positions"}
              </span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div
              class="rounded-lg border border-border/70 bg-background/40 p-3"
            >
              <p class="text-[11px] text-muted-foreground">Amount placed</p>
              <p class="mt-1 text-sm font-semibold">
                {formatKES(openStakeCents / 100)}
              </p>
            </div>

            <div
              class="rounded-lg border border-border/70 bg-background/40 p-3"
            >
              <p class="text-[11px] text-muted-foreground">Could receive</p>
              <p class="mt-1 text-sm font-semibold">
                {formatKES(possiblePayoutCents / 100)}
              </p>
            </div>

            <div
              class="rounded-lg border border-border/70 bg-background/40 p-3"
            >
              <p class="text-[11px] text-muted-foreground">Possible gain</p>
              <p class={`mt-1 text-sm font-semibold ${possibleGainClass}`}>
                {formatSignedKES(possibleGainCents)}
              </p>
            </div>
          </div>

          <div
            class="mt-5 rounded-lg border border-border/70 bg-background/40 px-3 py-3 text-[11px] leading-relaxed text-muted-foreground"
          >
            Estimates assume your open positions win using current market pools.
            Final payouts may change as more predictions are placed.
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats section -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-4">
    <div class="mx-auto w-full max-w-5xl">
      <h2 class="text-xl md:text-2xl font-semibold mb-6">Your Performance</h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {#each stats as stat}
          <div
            class="group rounded-xl border border-border bg-card p-5 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div class="flex items-center justify-between mb-4">
              <div
                class="p-3 rounded-lg shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md
                {stat.highlight === 'green'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                  : stat.highlight === 'red'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                    : 'bg-zinc-100 text-zinc-700 dark:bg-muted dark:text-muted-foreground'}"
              >
                {#if stat.icon === "accuracy"}
                  <TrendingUp class="h-4 w-4" />
                {:else if stat.icon === "total"}
                  <ListChecks class="h-4 w-4" />
                {:else if stat.icon === "correct"}
                  <Heart class="h-4 w-4" />
                {:else}
                  <Timer class="h-4 w-4" />
                {/if}
              </div>
            </div>
            <p class="text-xs text-muted-foreground font-medium">
              {stat.label}
            </p>
            <p class="text-3xl font-bold text-foreground mt-2">
              {stat.value}
            </p>
            <p class="text-xs text-muted-foreground mt-3">
              {stat.subtext}
            </p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Positions ledger -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-8">
    <div class="mx-auto w-full max-w-5xl">
      <div class="mb-5">
        <h2 class="text-xl md:text-2xl font-semibold">All Positions</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Track every prediction you have placed, open or settled.
        </p>
      </div>

      {#if predictions.length === 0}
        <p class="text-sm text-muted-foreground">
          You haven't placed any bets yet. Once you start predicting, your
          history will appear here.
        </p>
      {:else}
        <div class="mb-5 grid grid-cols-2 gap-2 md:grid-cols-4">
          {#each positionFilters as filter}
            <button
              type="button"
              class={`rounded-xl border px-3 py-3 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                positionFilter === filter.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:border-primary/40"
              }`}
              onclick={() => (positionFilter = filter.key)}
            >
              <span class="block text-xs opacity-80">{filter.label}</span>
              <span class="mt-1 block text-2xl font-semibold">
                {filter.count}
              </span>
            </button>
          {/each}
        </div>

        {#if filteredPredictions.length === 0}
          <p class="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            No {positionFilter} positions yet.
          </p>
        {:else}
        <div class="space-y-3">
          {#each visiblePredictions as p}
            <a
              href={`/market/${encodeURIComponent(p.marketId)}`}
              class="block rounded-xl border border-border bg-card p-4 transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
            >
              <div
                class="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-stretch lg:gap-3"
              >
                <div
                  class="min-w-0 rounded-lg border border-border/70 bg-background/40 p-3 lg:h-full"
                >
                  <div
                    class="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] md:items-stretch lg:h-full"
                  >
                    <div class="min-w-0 pt-1 pl-1">
                      <div class="min-w-0">
                        <div class="mb-3 flex flex-wrap items-center gap-2">
                      <span
                        class="inline-block rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground"
                      >
                        {p.category}
                      </span>
                      <span
                        class="inline-block rounded px-2 py-1 text-xs font-medium
                        {p.status === 'open'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : p.status === 'closed'
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                            : p.result === 'correct'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : p.result === 'incorrect'
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-muted text-muted-foreground'}"
                      >
                        {p.status === "settled"
                          ? resultLabel(p.result)
                          : statusLabel(p.status)}
                      </span>
                        </div>
                        <h3
                          class="text-lg font-semibold leading-snug text-foreground"
                        >
                          {p.title}
                        </h3>
                      </div>
                      <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Placed {p.date}</span>
                        {#if p.closeDate}
                          <span>{p.closeLabel} {p.closeDate}</span>
                        {/if}
                      </div>
                    </div>

                    <div
                      class="grid w-full grid-cols-1 items-center gap-4 self-center text-center sm:grid-cols-[minmax(120px,1fr)_minmax(150px,1.2fr)]"
                    >
                      <div>
                        <p class="mb-1 text-[11px] text-muted-foreground">
                          Your pick
                        </p>
                        <div
                          class="btn mx-auto flex min-h-11 w-full max-w-[150px] items-center justify-center px-3 py-2 text-sm font-semibold
                          {p.prediction === 'yes' ? 'btn-yes' : 'btn-no'}"
                        >
                          {p.prediction.toUpperCase()}
                        </div>
                      </div>

                      <div class="w-full">
                        <p class="mb-1 text-[11px] text-muted-foreground">
                          Current market
                        </p>
                        <div class="grid grid-cols-2 gap-4">
                          <div>
                            <p class="text-xl font-bold text-emerald-500 dark:text-emerald-400">
                              {p.yesPercentage}%
                            </p>
                            <p class="text-[11px] text-muted-foreground">Yes</p>
                          </div>
                          <div>
                            <p class="text-xl font-bold text-red-500 dark:text-red-400">
                              {p.noPercentage}%
                            </p>
                            <p class="text-[11px] text-muted-foreground">No</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  class="rounded-lg border border-border/70 bg-background/40 p-3 lg:px-3 lg:py-3 lg:text-right"
                >
                  <div class="grid grid-cols-2 gap-3">
                    <div class="text-left">
                      <p class="text-[11px] text-muted-foreground">
                        Amount placed
                      </p>
                      <p class="mt-1 text-sm font-semibold">
                        {formatKES(p.stakeCents / 100)}
                      </p>
                    </div>

                    <div class="text-right">
                      <p class="text-[11px] text-muted-foreground">
                        {p.outcomeLabel}
                      </p>
                      <p
                        class={`mt-1 text-lg font-semibold ${moneyToneClass(p.outcomeTone)}`}
                      >
                        {p.outcomeCents != null
                          ? p.outcomeLabel === "Lost"
                            ? formatKES(p.outcomeCents / 100)
                            : formatSignedKES(p.outcomeCents)
                          : "Pending"}
                      </p>
                    </div>
                  </div>

                  <div class="mt-3 border-t border-border/60 pt-3">
                    <p class="text-[11px] text-muted-foreground">
                      {p.payoutLabel}
                    </p>
                    <p class="text-sm font-semibold">
                      {p.payoutCents != null
                        ? formatKES(p.payoutCents / 100)
                        : "Pending"}
                    </p>
                  </div>
                </div>
              </div>
            </a>
          {/each}
        </div>
        {/if}
      {/if}
      {#if filteredPredictions.length > visibleBets}
        <button
          type="button"
          onclick={() => (visibleBets += LOAD_STEP)}
          class="mt-6 block mx-auto rounded-md border border-border bg-transparent px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Load More
        </button>
      {/if}
    </div>
  </section>
  {#if data.openDeposit}
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div class="bg-card p-6 rounded-xl border border-border w-full max-w-sm">
        <p class="text-sm mb-4">Deposit modal restored</p>

        <form method="POST" action="?/deposit">
          <input
            type="number"
            name="amount"
            placeholder="Enter amount"
            class="w-full mb-4 rounded-md border px-3 py-2"
            required
          />

          <button
            type="submit"
            class="w-full rounded-md bg-primary py-2 text-primary-foreground"
          >
            Confirm Deposit
          </button>
        </form>

        <button
          class="mt-3 text-xs text-muted-foreground"
          onclick={() => goto("/portfolio")}
        >
          Close
        </button>
      </div>
    </div>
  {/if}
</main>
