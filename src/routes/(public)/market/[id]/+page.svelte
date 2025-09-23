<script lang="ts">
  import { toggleTheme } from "$lib/theme";
  import { Sun, Moon, ChartNoAxesCombined } from "lucide-svelte";
  import type { PageData } from "./$types";
  import { LogIn, UserRound } from "lucide-svelte";
  export let data: PageData;
  let isAuthed = true; // swap for data.isAuthed

  const market = data.market;
  const outcomes = data.outcomes ?? [];

  // Helpers
  const priceOf = (o: any) => {
    if (typeof o.price_kes === "number") return o.price_kes;
    if (typeof o.price === "number") return o.price;
    if (typeof o.price_cents === "number") return o.price_cents;
    if (typeof o.cents === "number") return o.cents;
    return 0;
  };
  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE").format(v)}`;

  // Same “primary nav” labels you show on the home page
  const categories = [
    "Trending",
    "Breaking News",
    "New",
    "Politics",
    "Sports",
    "Kenya",
    "Tanzania",
  ];
  const tags = [
    "All",
    "Ruto Presidency",
    "Kenya vs Morocco",
    "CHAN",
    "Nairobi Governor",
    "Juba",
    "Sudan",
  ];
</script>

<!-- Header -->
<header
  class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur"
>
  <div
    class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-[64px] flex items-center gap-3"
  >
    <a href="/" class="inline-flex items-center gap-2">
      <span
        class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-7 w-7"
      >
        <ChartNoAxesCombined class="h-4 w-4" />
      </span>
      <span class="font-semibold">SokoMjinga</span>
    </a>

    <!-- search -->
    <div class="ml-3 flex-1">
      <div class="relative">
        <input
          class="w-full sm:w-[360px] md:w-[480px] lg:w-[560px] xl:w-[640px] rounded-md border
                border-border bg-input px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none
                focus:ring-2 focus:ring-ring"
          placeholder="Search markets"
        />
      </div>
    </div>

    <!-- Theme Toggle (same spot/order as homepage) -->
    <div class="ml-auto flex items-center gap-2">
      <button
        class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-input hover:bg-card transition"
        on:click={toggleTheme}
        aria-label="Toggle theme"
      >
        <Sun
          class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        />
        <Moon
          class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        />
      </button>
    </div>

    <!-- right actions -->
    {#if isAuthed}
      <!-- desktop -->
      <a
        href="/portfolio"
        class="hidden lg:inline-flex text-sm text-muted-foreground hover:text-foreground"
        >Portfolio KES 0.00</a
      >
      <a
        href="/deposit"
        class="ml-3 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >Deposit</a
      >
      <a
        href="/account"
        class="ml-3 hidden sm:inline-flex text-sm text-muted-foreground hover:text-foreground"
        >My Account</a
      >
      <!-- mobile icon -->
      <a
        href="/account"
        class="ml-2 inline-flex sm:hidden items-center justify-center rounded-md border border-border bg-card p-2"
        aria-label="Account"
      >
        <UserRound class="h-4 w-4" />
      </a>
    {:else}
      <!-- desktop buttons -->
      <a
        href="/login"
        class="ml-2 hidden sm:inline-flex rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >Log In</a
      >
      <a
        href="/signup"
        class="ml-2 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >Sign Up</a
      >
      <!-- mobile condensed -->
      <a
        href="/login"
        class="ml-2 inline-flex sm:hidden items-center justify-center rounded-md border border-border bg-card p-2"
        aria-label="Log In"
      >
        <LogIn class="h-4 w-4" />
      </a>
      <a
        href="/signup"
        class="ml-2 inline-flex md:hidden rounded-md bg-primary px-2 py-2 text-xs text-primary-foreground hover:opacity-90"
        >Sign Up</a
      >
    {/if}
  </div>

  <!-- primary nav row -->
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

  <!-- secondary tags row (optional, matches homepage look) -->
  <div class="border-t border-border/60">
    <div
      class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none"
    >
      {#each tags as t, i}
        <button
          class="shrink-0 rounded-md px-3 py-1.5 text-xs md:text-sm
            {i === 0
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
        >
          {t}
        </button>
      {/each}
    </div>
  </div>
</header>

<!-- CONTENT -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  <!-- Title / meta -->
  <div class="mb-4">
    <h1 class="text-2xl md:text-3xl font-semibold leading-tight">
      {market.title}
    </h1>
    <div class="mt-1 text-xs text-muted-foreground">
      status:
      <span class="uppercase">
        {(market.status ?? "open").toUpperCase()}
      </span>
    </div>
  </div>

  <!-- Two-column: chart left, buy panel right -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <!-- LEFT: Chart / context -->
    <section class="md:col-span-2 space-y-6">
      <!-- Chart placeholder (slightly shorter) -->
      <div class="rounded-xl border border-border bg-card">
        <div class="p-4 border-b border-border/60 text-sm font-medium">
          Price chart
        </div>
        <div
          class="h-[360px] m-4 rounded border border-dashed border-border/70 bg-muted/10
                        flex items-center justify-center text-sm text-muted-foreground"
        >
          Chart placeholder
        </div>
      </div>

      <!-- Market context -->
      <div class="rounded-xl border border-border bg-card">
        <div class="p-4 border-b border-border/60 text-sm font-medium">
          Market Context
        </div>
        <div class="p-4 text-sm text-muted-foreground">
          {market.description ?? "No description."}
        </div>
      </div>
    </section>

    <!-- RIGHT: Buy box -->
    <aside class="md:col-span-1">
      <div class="rounded-xl border border-border bg-card overflow-hidden">
        <div class="p-4 border-b border-border/60 text-sm font-medium">Buy</div>

        <div class="p-3 space-y-3">
          {#if outcomes.length > 0}
            {#each outcomes as o}
              <button
                class="w-full rounded-md border border-border bg-input px-3 py-3 text-sm
                        hover:bg-accent hover:text-accent-foreground
                        flex items-center justify-between"
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

        <!-- Quick-amount row (visual only) -->
        <div class="p-3 border-t border-border/60 flex gap-2">
          <button class="rounded-md bg-neutral px-2 py-1 text-xs"
            >+KES 100</button
          >
          <button class="rounded-md bg-neutral px-2 py-1 text-xs"
            >+KES 500</button
          >
          <button class="rounded-md bg-neutral px-2 py-1 text-xs"
            >+KES 1,000</button
          >
          <button class="rounded-md bg-neutral px-2 py-1 text-xs">Max</button>
        </div>
      </div>
    </aside>
  </div>
</main>
