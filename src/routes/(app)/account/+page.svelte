<!-- src/routes/(app)/account/+page.svelte -->
<script lang="ts">
  import { Mail, Phone } from "lucide-svelte";

  // Still accept data from +page.server.ts (user from /auth/me)
  export let data: {
    user: any;
  };

  const u = data.user ?? {};
  const profile = u.profile ?? u.user_profile ?? {};

  // Derived fields from existing API shape
  const displayName =
    u.name ?? profile.full_name ?? profile.name ?? "John Mwangi";

  const email = u.email ?? profile.email ?? "";

  const phone = profile.phone ?? u.phone ?? "";

  const handle =
    profile.handle ??
    profile.username ??
    (email ? `@${email.split("@")[0]}` : "@johnmwangi");

  const bio =
    profile.bio ??
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

  // Static stats for now – will later come from API
  const stats = [
    {
      icon: "accuracy",
      label: "Accuracy",
      value: "67%",
      subtext: "124 out of 185 predictions",
      highlight: "green",
    },
    {
      icon: "total",
      label: "Total Predictions",
      value: "185",
      subtext: "+12 this month",
      highlight: "neutral",
    },
    {
      icon: "correct",
      label: "Correct",
      value: "124",
      subtext: "+8 this week",
      highlight: "green",
    },
    {
      icon: "incorrect",
      label: "Incorrect",
      value: "61",
      subtext: "+2 this week",
      highlight: "red",
    },
  ] as const;

  type ResultKind = "correct" | "incorrect" | "pending";

  const predictions: {
    id: string;
    title: string;
    category: string;
    prediction: "yes" | "no";
    result: ResultKind;
    date: string;
    yesPercentage: number;
    noPercentage: number;
  }[] = [
    {
      id: "1",
      title: "Will Ruto pick Gladys Wanga as running-mate in 2027?",
      category: "Politics",
      prediction: "yes",
      result: "pending",
      date: "10/10/2023",
      yesPercentage: 45,
      noPercentage: 55,
    },
    {
      id: "2",
      title: "Will Bitcoin close above $100,000 by year-end?",
      category: "Finance",
      prediction: "yes",
      result: "correct",
      date: "9/20/2023",
      yesPercentage: 64,
      noPercentage: 36,
    },
    {
      id: "3",
      title: "Will Manchester City win the Premier League this season?",
      category: "Sports",
      prediction: "yes",
      result: "correct",
      date: "9/20/2023",
      yesPercentage: 68,
      noPercentage: 32,
    },
    {
      id: "4",
      title: "Will Nairobi record a daily high above 35°C this month?",
      category: "Weather",
      prediction: "no",
      result: "incorrect",
      date: "8/15/2023",
      yesPercentage: 62,
      noPercentage: 38,
    },
  ];

  const resultLabel = (r: ResultKind) =>
    r === "pending" ? "Pending" : r.charAt(0).toUpperCase() + r.slice(1);
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
            <span class="mr-2">⤴</span>
            Share Profile
          </button>
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-xs md:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Settings"
          >
            ⚙
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
          <div class="min-w-0">
            <p
              class="text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Phone
            </p>
            <p class="truncate text-foreground">
              {phone || "Not set"}
            </p>
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
                  ↑
                {:else if stat.icon === "total"}
                  ●
                {:else if stat.icon === "correct"}
                  ♥
                {:else}
                  ⏱
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

      <div class="space-y-3">
        {#each predictions as p}
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
                <h3 class="font-semibold text-sm md:text-base text-foreground">
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
                  ☆
                </button>
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md border border-border bg-transparent px-3 py-2 text-xs text-muted-foreground hover:bg-red-900/40 hover:text-red-400"
                  aria-label="Delete"
                >
                  🗑
                </button>
              </div>
            </div>
          </article>
        {/each}
      </div>
    </div>
  </section>
</main>
