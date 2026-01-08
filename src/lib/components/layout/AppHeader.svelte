<!-- src/lib/components/layout/AppHeader.svelte -->

<script lang="ts">
  import { toggleTheme } from "$lib/theme";
  import {
    ChartNoAxesCombined,
    Sun,
    Moon,
    LogIn,
    LogOut,
    UserRound,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";

  export let isAuthed: boolean;
  export let portfolioLabel: string = "Portfolio KES 0.00";
  export let portfolioHref: string = "/portfolio";
  export let depositHref: string = "/portfolio?deposit=1";

  let openMenu = false;

  const handleDepositClick = (event: MouseEvent) => {
    event.preventDefault();
    const stamp = Date.now();
    goto(`/portfolio?deposit=${stamp}`);
  };
</script>

<header
  class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur"
>
  <div
    class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-[64px]
           flex items-center gap-3 whitespace-nowrap"
  >
    <!-- Logo -->
    <a href="/" class="inline-flex items-center gap-2 shrink-0">
      <span
        class="inline-flex items-center justify-center rounded-md
               bg-primary text-primary-foreground h-7 w-7"
      >
        <ChartNoAxesCombined class="h-4 w-4" />
      </span>
      <span class="font-semibold">MaoniMarket</span>
    </a>

    <!-- Search (DESKTOP ONLY) -->
    <div class="ml-3 flex-1 hidden sm:block">
      <input
        class="w-full sm:w-[360px] md:w-[480px] lg:w-[560px]
               rounded-md border border-border bg-input px-3 py-2 text-sm
               placeholder-muted-foreground focus:outline-none
               focus:ring-2 focus:ring-ring"
        placeholder="Search markets"
      />
    </div>

    <!-- Theme toggle (ALWAYS VISIBLE) -->
    <button
      class="ml-auto inline-flex h-9 w-9 items-center justify-center
             rounded-md border border-border bg-input hover:bg-card transition"
      on:click={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun
        class="h-4 w-4 rotate-0 scale-100 transition-all
               dark:-rotate-90 dark:scale-0"
      />
      <Moon
        class="absolute h-4 w-4 rotate-90 scale-0 transition-all
               dark:rotate-0 dark:scale-100"
      />
    </button>

    {#if isAuthed}
      <!-- Portfolio (DESKTOP) -->
      <a
        href={portfolioHref}
        class="hidden md:inline-flex text-sm text-muted-foreground px-2"
      >
        {portfolioLabel}
      </a>

      <!-- Portfolio (MOBILE – compact, no overflow) -->
      <a
        href={portfolioHref}
        class="md:hidden text-sm font-semibold text-foreground px-2 truncate max-w-[140px]"
      >
        {portfolioLabel.replace("Portfolio ", "")}
      </a>

      <!-- Deposit (DESKTOP ONLY) -->
      <a
        href={depositHref}
        class="hidden md:inline-flex rounded-md bg-primary
               px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        on:click={handleDepositClick}
      >
        Deposit
      </a>

      <!-- Account -->
      <div class="relative ml-1">
        <button
          class="inline-flex items-center justify-center rounded-md
                 border border-border bg-card p-2"
          aria-haspopup="menu"
          aria-expanded={openMenu}
          on:click={() => (openMenu = !openMenu)}
        >
          <UserRound class="h-4 w-4" />
        </button>

        {#if openMenu}
          <div
            class="absolute right-0 mt-2 w-56 rounded-xl
                   border border-border bg-popover shadow-lg p-1 text-sm"
            on:focusout={(e) => {
              const el = e.currentTarget as HTMLElement;
              if (!el.contains(e.relatedTarget as Node)) openMenu = false;
            }}
          >
            <a
              href="/account"
              class="flex items-center gap-2 rounded-lg px-3 py-2
                     hover:bg-accent hover:text-accent-foreground"
              on:click={() => (openMenu = false)}
            >
              <UserRound class="h-4 w-4" />
              Profile
            </a>

            <div class="my-1 h-px bg-border/70"></div>

            <form method="post" action="/logout">
              <button
                type="submit"
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2
                       text-red-500 hover:bg-accent hover:text-red-600"
              >
                <LogOut class="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        {/if}
      </div>
    {:else}
      <!-- NOT AUTHED -->
      <a
        href="/login"
        class="hidden sm:inline-flex rounded-md border border-border
               bg-card px-3 py-2 text-sm hover:bg-accent"
      >
        Log In
      </a>

      <a
        href="/login"
        class="hidden md:inline-flex rounded-md bg-primary
               px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
      >
        Sign Up
      </a>

      <!-- Mobile auth icon -->
      <a
        href="/login"
        class="inline-flex sm:hidden rounded-md border border-border
               bg-card p-2"
      >
        <LogIn class="h-4 w-4" />
      </a>
    {/if}
  </div>
</header>
