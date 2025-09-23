<script lang="ts">
  import { toggleTheme } from "$lib/theme";
  import { Sun, Moon, ChartNoAxesCombined } from "lucide-svelte";
  import { LogIn, UserRound } from "lucide-svelte";
  export let data: { isAuthed: boolean; markets: any[] };
  // let isAuthed = data.isAuthed;
  let isAuthed = false; // swap for data.isAuthed

  // let isAuthed = false; // flip to true to see the small header delta
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

  import { Bookmark, Gift } from "lucide-svelte";

  // derive a % chance from outcomes if you have it
  const yesOf = (m: any) =>
    m.outcomes?.find((o: any) => /^(yes|true)$/i.test(o.name ?? o.label ?? ""));
  const noOf = (m: any) =>
    m.outcomes?.find((o: any) => /^(no|false)$/i.test(o.name ?? o.label ?? ""));

  // If you seed with `price_cents` (0–100), treat that as probability.
  // If you only have KES prices now, chance returns null and we hide the gauge.
  const chanceOf = (m: any) => {
    const y = yesOf(m);
    if (typeof y?.price_cents === "number") return Math.round(y.price_cents);
    if (typeof y?.prob === "number") return Math.round(y.prob * 100);
    return null;
  };

  const priceLabel = (o: any) => {
    if (typeof o?.price_cents === "number") return `${o.price_cents}¢`;
    if (typeof o?.price_kes === "number")
      return `KES ${new Intl.NumberFormat("en-KE").format(o.price_kes)}`;
    if (typeof o?.price === "number")
      return `KES ${new Intl.NumberFormat("en-KE").format(o.price)}`;
    return "—";
  };

  const volLabel = (m: any) => (m.volume ? m.volume : "— Vol.");

  const FALLBACK_CHANCE = 54;
  import { goto } from "$app/navigation";
  const goLogin = () => goto("/login");
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
        <!-- <GalleryVerticalEndIcon class="h-4 w-4" /> -->
        <ChartNoAxesCombined class="h-4 w-4" />
      </span>
      <span class="font-semibold">SokoMjinga</span>
    </a>

    <!-- search -->
    <div class="ml-3 flex-1">
      <div class="relative">
        <input
          class="w-full sm:w-[360px] md:w-[480px] lg:w-[560px] xl:w-[640px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search markets"
        />
      </div>
    </div>

    <!-- Theme Toggle -->
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
      >
        Sign Up
      </a>
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

  <!-- secondary tags row -->
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

<!-- Grid CONTENT -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  <div
    class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
  >
    {#each data.markets as m}
      <article
        class="card group rounded-xl border border-border/70 bg-card/80 shadow-sm hover:border-primary/40 transition-colors"
      >
        <!-- card header -->
        <a href={`/market/${m.id}`} class="group block p-1">
          <!-- HEADER -->
          <!-- Thumb -->
          <div
            class="p-4 lg:p-5 flex items-start gap-4 border-b border-border/60"
          >
            <div
              class="h-12 w-12 shrink-0 rounded bg-muted/60 overflow-hidden flex items-center justify-center text-xs"
            >
              {#if m.img}
                <img
                  class="h-full w-full object-cover"
                  src={m.img}
                  alt={m.title ?? ""}
                />
              {:else}
                {m.title?.slice(0, 2)?.toUpperCase() ?? "MK"}
              {/if}
            </div>

            <!-- Title -->
            <div class="min-w-0 flex-1">
              <h3 class="text-[15px] font-semibold leading-snug line-clamp-2">
                {m.title}
              </h3>
            </div>

            <!-- Gauge (donut) – always render, fallback to static % -->
            {#key m.id}
              <div class="relative h-11 w-11 shrink-0 mt-0.5">
                <div
                  class="gauge"
                  style={`--_p:${chanceOf(m) ?? FALLBACK_CHANCE}`}
                ></div>
                <div
                  class="pointer-events-none absolute inset-0 flex items-center justify-center text-[11px] font-semibold"
                >
                  {chanceOf(m) ?? FALLBACK_CHANCE}<span
                    class="ml-0.5 text-[10px]">%</span
                  >
                </div>
              </div>
            {/key}
          </div>

          <!-- BUTTON ROW -->
          <div class="px-4 lg:px-5 pt-3 pb-4">
            <div class="grid grid-cols-2 gap-3">
              <!-- Yes -->
              <button type="button" class="btn btn-yes" on:click|preventDefault>
                <div class="flex items-center justify-between">
                  <span>Yes</span>
                  <span class="font-semibold">{priceLabel(yesOf(m))}</span>
                </div>
              </button>

              <!-- No -->
              <button type="button" class="btn btn-no" on:click|preventDefault>
                <div class="flex items-center justify-between">
                  <span>No</span>
                  <span class="font-semibold">{priceLabel(noOf(m))}</span>
                </div>
              </button>
            </div>
          </div>

          <!-- FOOTER -->
          <div
            class="px-4 lg:px-5 pb-4 pt-3 flex items-center text-xs text-muted-foreground"
          >
            <span class="flex-1">{volLabel(m)}</span>
            <div
              class="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
            >
              <button
                class="p-1 rounded hover:bg-accent"
                on:click|preventDefault
                aria-label="Gift"><Gift class="h-4 w-4" /></button
              >
              <button
                class="p-1 rounded hover:bg-accent"
                on:click={goLogin}
                aria-label="Bookmark"
                title="Bookmark"
              >
                <Bookmark class="h-4 w-4" />
              </button>
            </div>
          </div>
        </a>
      </article>
    {/each}
  </div>
</main>
