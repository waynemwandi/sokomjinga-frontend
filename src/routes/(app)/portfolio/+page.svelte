<!-- src/routes/(app)/portfolio/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";
  import {
    Bookmark,
    Trash2,
    TrendingUp,
    ListChecks,
    Heart,
    Timer,
  } from "lucide-svelte";

  export let data: PageData & {
    wallet?: {
      balance_cents?: number;
    };
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
    prediction?: "yes" | "no" | string;
    result?: "correct" | "incorrect" | "pending" | string;
    created_at?: string;
    yes_percentage?: number;
    no_percentage?: number;
  };

  type ResultKind = "correct" | "incorrect" | "pending";

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
    return dt.toLocaleDateString("en-KE");
  };

  type PredictionItem = {
    id: string;
    title: string;
    category: string;
    prediction: "yes" | "no";
    result: ResultKind;
    date: string;
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

    return {
      id: String(b.bet_id ?? b.id ?? idx),
      title,
      category,
      prediction,
      result: toResultKind(b.result),
      date: formatDate(b.created_at),
      yesPercentage,
      noPercentage,
    };
  });

  const resultLabel = (r: ResultKind) =>
    r === "pending" ? "Pending" : r.charAt(0).toUpperCase() + r.slice(1);

  let visibleBets = 3;
  const LOAD_STEP = 3;

  $: visiblePredictions = predictions.slice(0, visibleBets);

  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)}`;
</script>

<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6 space-y-6">
  <!-- Header -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-2">
    <div class="mx-auto w-full max-w-5xl space-y-1">
      <h1 class="text-2xl md:text-3xl font-semibold">Portfolio</h1>
      <p class="text-sm text-muted-foreground">
        View your wallet balance, open positions, and prediction history.
      </p>
    </div>
  </section>

  <!-- Balance + quick stats -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-4">
    <div class="mx-auto w-full max-w-5xl">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Balance card -->
        <div class="lg:col-span-2">
          <div
            class="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div class="mb-6 flex items-start justify-between gap-3">
              <div>
                <p class="text-xs font-medium text-muted-foreground mb-1">
                  Available balance
                </p>
                <p class="text-3xl md:text-4xl font-semibold">
                  {formatKES((data.wallet?.balance_cents ?? 0) / 100)}
                </p>
              </div>
              <span
                class="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
              >
                Active
              </span>
            </div>

            <div
              class="mb-6 border-t border-border/70 pt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3"
            >
              <div>
                <p class="text-xs font-medium text-muted-foreground mb-1">
                  In open positions
                </p>
                <p class="text-xl font-semibold">KES 0</p>
              </div>
              <div class="text-xs text-muted-foreground">
                <span class="font-medium">0</span> active bets
              </div>
            </div>

            <div class="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onclick={() => goto("/portfolio?deposit=1")}
                class="flex-1 rounded-md border border-border bg-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition"
              >
                Deposit cash
              </button>
              <button
                type="button"
                class="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm font-medium hover:bg-muted transition"
                disabled
                aria-disabled="true"
                title="Withdrawals coming soon"
              >
                Withdraw (soon)
              </button>
            </div>
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
            class="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
          >
            <div class="flex items-center justify-between mb-4">
              <div
                class="p-3 rounded-lg
                {stat.highlight === 'green'
                  ? 'bg-emerald-900/40 text-emerald-400'
                  : stat.highlight === 'red'
                    ? 'bg-red-900/40 text-red-400'
                    : 'bg-muted text-muted-foreground'}"
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

  <!-- Prediction history -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-8">
    <div class="mx-auto w-full max-w-5xl">
      <h2 class="text-xl md:text-2xl font-semibold mb-6">Prediction History</h2>

      {#if predictions.length === 0}
        <p class="text-sm text-muted-foreground">
          You haven't placed any bets yet. Once you start predicting, your
          history will appear here.
        </p>
      {:else}
        <div class="space-y-3">
          {#each visiblePredictions as p}
            <article
              class="rounded-xl border border-border bg-card p-5 hover:border-primary/40 transition-colors"
            >
              <div
                class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <!-- Left -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span
                      class="inline-block rounded px-2 py-1 text-xs font-medium bg-muted text-muted-foreground"
                    >
                      {p.category}
                    </span>
                    <span
                      class="inline-block rounded px-2 py-1 text-xs font-medium
                      {p.result === 'correct'
                        ? 'bg-emerald-900/40 text-emerald-400'
                        : p.result === 'incorrect'
                          ? 'bg-red-900/40 text-red-400'
                          : 'bg-muted text-muted-foreground'}"
                    >
                      {resultLabel(p.result)}
                    </span>
                  </div>
                  <h3
                    class="font-semibold text-sm md:text-base text-foreground"
                  >
                    {p.title}
                  </h3>
                  <p class="text-xs text-muted-foreground mt-2">{p.date}</p>
                </div>

                <!-- Middle -->
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <p class="text-[11px] text-muted-foreground mb-1">
                      Your Prediction
                    </p>
                    <div
                      class="px-4 py-2 rounded text-sm font-semibold
                      {p.prediction === 'yes'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-red-600 text-white'}"
                    >
                      {p.prediction.toUpperCase()}
                    </div>
                  </div>

                  <div class="flex gap-4 text-center">
                    <div>
                      <p class="text-lg font-bold text-emerald-400">
                        {p.yesPercentage}%
                      </p>
                      <p class="text-[11px] text-muted-foreground">Yes</p>
                    </div>
                    <div>
                      <p class="text-lg font-bold text-red-400">
                        {p.noPercentage}%
                      </p>
                      <p class="text-[11px] text-muted-foreground">No</p>
                    </div>
                  </div>
                </div>

                <!-- Right actions -->
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    aria-label="Bookmark"
                  >
                    <Bookmark class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    class="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground hover:bg-red-900/40 hover:text-red-400"
                    aria-label="Delete"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          {/each}
        </div>
      {/if}
      {#if predictions.length > visibleBets}
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
