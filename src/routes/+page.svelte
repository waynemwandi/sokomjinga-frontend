<script lang="ts">
  import { toggleTheme } from '$lib/theme';
  import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
  import { Sun, Moon, ChartNoAxesCombined } from 'lucide-svelte';
  export let data: { isAuthed: boolean; markets: any[] };
  let isAuthed = data.isAuthed;

  // let isAuthed = false; // flip to true to see the small header delta
  const categories = ["Trending","Breaking News","New","Politics","Sports","Kenya","Tanzania"];
  const tags = ["All","Ruto Presidency","Kenya vs Morocco","CHAN","Nairobi Governor","Juba", "Sudan"];

</script>

<!-- Header -->
<header class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
  <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-[64px] flex items-center gap-3">
    <a href="/" class="inline-flex items-center gap-2">
      <span class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-7 w-7">
        <!-- <GalleryVerticalEndIcon class="h-4 w-4" /> -->
        <ChartNoAxesCombined class="h-4 w-4" />
      </span>
      <span class="font-semibold">SokoMjinga</span>
    </a>

    <!-- search -->
    <div class="ml-3 flex-1">
      <div class="relative">
        <input
          class="w-full md:w-[560px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
            <Sun class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
        </div>

    <!-- right actions -->
    {#if isAuthed}
      <a href="/portfolio" class="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground">Portfolio $0.00</a>
      <a href="/deposit" class="ml-3 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Deposit</a>
      <a href="/account" class="ml-4 text-sm text-muted-foreground hover:text-foreground">My Account</a>
    {:else}
      <a href="/login" class="ml-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">Log In</a>
      <a href="/signup" class="ml-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Sign Up</a>
    {/if}
  </div>

  <!-- primary nav row -->
  <div class="border-t border-border/60">
    <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-4 overflow-x-auto">
      {#each categories as c}
        <button class="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent">
          {c}
        </button>
      {/each}
    </div>
  </div>

  <!-- secondary tags row -->
  <div class="border-t border-border/60">
    <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-2 overflow-x-auto">
      {#each tags as t, i}
        <button
          class="shrink-0 rounded-md px-3 py-1.5 text-xs md:text-sm
                 {i === 0 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}">
          {t}
        </button>
      {/each}
    </div>
  </div>
</header>

<!-- Grid -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
    {#each data.markets as m}
      <article class="group rounded-xl border border-border/70 bg-card/80 shadow-sm hover:border-primary/40 transition-colors">
        <!-- card header -->
        <div class="flex items-start gap-3 p-4 border-b border-border/60">
          <div class="h-10 w-10 rounded bg-muted/50 flex items-center justify-center text-xs">
            {m.title?.slice(0,2)?.toUpperCase() ?? 'MK'}
          </div>
          <div class="min-w-0">
            <h3 class="text-sm font-medium leading-snug line-clamp-2">{m.title}</h3>
            <div class="mt-1 text-xs text-muted-foreground">{m.status ?? 'open'}</div>
          </div>
          <div class="ml-auto opacity-60 group-hover:opacity-100 transition">⋯</div>
        </div>

        <!-- outcomes (optional) -->
        <div class="p-4 flex flex-col gap-3">
          {#if m.outcomes?.length}
            {#each m.outcomes as o}
              <button class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center justify-between">
                <span>{o.label}</span>
                <span class="font-semibold">{o.pct}%</span>
              </button>
            {/each}
          {:else}
            <div class="text-xs text-muted-foreground">No outcomes yet.</div>
          {/if}
        </div>

        <div class="px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          More details ▸
        </div>
      </article>
    {/each}
  </div>
</main>
