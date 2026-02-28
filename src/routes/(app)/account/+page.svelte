<!-- src/routes/(app)/account/+page.svelte -->
<script lang="ts">
  import {
    Mail,
    Phone,
    ArrowUpRight,
    Settings,
    Bookmark,
    Trash2,
    TrendingUp,
    ListChecks,
    Heart,
    Timer,
  } from "lucide-svelte";

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

  export let data: {
    user: any;
    stats?: StatsResponse | null;
    bets?: Bet[];
    positions?: any[];
    profile?: {
      phone_e164?: string | null;
      phone_verified?: boolean;
    };
  };

  // debug
  // console.log("ACCOUNT PAGE DATA", data);
  // console.log("BETS", data.bets);
  // console.log("STATS", data.stats);

  const u = data.user ?? {};
  const userProfile = u.profile ?? u.user_profile ?? {};
  const serverProfile = data.profile ?? null;

  let phone: string | null = serverProfile?.phone_e164 ?? null;
  let phoneVerified = serverProfile?.phone_verified ?? false;

  const displayName = u.name ?? userProfile.full_name ?? userProfile.name;

  const email = u.email ?? userProfile.email ?? "";

  let editingPhone = false;
  let phoneInput = "";
  let phoneError: string | null = null;
  let savingPhone = false;

  const handle =
    userProfile.handle ??
    userProfile.username ??
    (email ? `@${email.split("@")[0]}` : "@johnmwangi");

  const bio =
    userProfile.bio ??
    "Avid predictor and market enthusiast. I believe in the power of informed predictions and community intelligence.";

  const memberSince = u.created_at
    ? new Date(u.created_at).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
      })
    : "November 2024";

  const initials =
    (displayName &&
      displayName
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()) ||
    "JM";

  // ----- STATS NORMALIZATION -----
  const backendStats: StatsResponse = data.stats ?? {};

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

  const rawBets: Bet[] = data.bets ?? [];

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
</script>

<main class="space-y-8">
  <!-- Header section -->
  <section
    class="border-b border-border bg-card/40 -mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 py-8"
  >
    <div class="mx-auto w-full max-w-5xl">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="flex items-start gap-4">
          <!-- Avatar -->
          <div
            class="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white"
          >
            {initials}
          </div>

          <!-- User info -->
          <div>
            <h1 class="text-3xl font-bold text-foreground">
              {displayName}
            </h1>
            <p class="text-muted-foreground mt-1">{handle}</p>
            <p class="text-xs md:text-sm text-muted-foreground mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-xs md:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowUpRight class="mr-2 h-4 w-4" />
            Share Profile
          </button>

          <button
            type="button"
            class="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-xs md:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Settings"
          >
            <Settings class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Bio -->
      <p class="mt-6 text-sm md:text-base text-muted-foreground max-w-2xl">
        {bio}
      </p>

      <!-- Profile details row (email / phone) -->
      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div
          class="rounded-lg border border-border bg-card/60 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground"
          >
            <Mail class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Email
            </p>
            <p class="truncate text-foreground">
              {email || "Not set"}
            </p>
          </div>
        </div>

        <div
          class="rounded-lg border border-border bg-card/60 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground"
          >
            <Phone class="h-4 w-4" />
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Phone
            </p>

            {#if editingPhone}
              <form method="POST">
                <div class="mt-1 space-y-2">
                  <input
                    type="text"
                    name="phone"
                    bind:value={phoneInput}
                    placeholder="+2547XXXXXXXX"
                    class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                    required
                  />

                  <div class="flex gap-2">
                    <button
                      type="submit"
                      class="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      on:click={() => (editingPhone = false)}
                      class="rounded-md border border-border px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            {:else}
              <div class="flex items-center justify-between">
                <p class="truncate text-foreground">
                  {phone ?? "Not set"}
                </p>

                <button
                  type="button"
                  on:click={() => {
                    phoneInput = phone ?? "";
                    editingPhone = true;
                  }}
                  class="text-xs text-primary hover:underline"
                >
                  {phone ? "Edit" : "Add"}
                </button>
              </div>
            {/if}
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
          You haven’t placed any bets yet. Once you start predicting, your
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
          on:click={() => (visibleBets += LOAD_STEP)}
          class="mt-6 block mx-auto rounded-md border border-border bg-transparent px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Load More
        </button>
      {/if}
    </div>
  </section>
</main>
