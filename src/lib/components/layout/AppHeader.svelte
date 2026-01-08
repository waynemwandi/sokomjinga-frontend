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
    // force a new URL each time so SvelteKit re-runs the load
    const stamp = Date.now();
    goto(`/portfolio?deposit=${stamp}`);
  };
</script>

<header
  class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur"
>
  <div
    class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-[64px] flex items-center gap-3"
  >
    <!-- Logo -->
    <a href="/" class="inline-flex items-center gap-2">
      <span
        class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-7 w-7"
      >
        <ChartNoAxesCombined class="h-4 w-4" />
      </span>
      <span class="font-semibold">MaoniMarket</span>
    </a>

    <!-- Search -->
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

    {#if isAuthed}
      <!-- Right actions when authed -->
      <a
        href={portfolioHref}
        class="inline-flex lg:inline-flex sm:hidden text-shadow-sm text-muted-foreground px-2 py-1 hover:text-foreground"
      >
        {portfolioLabel}
      </a>
      <a
        href={depositHref}
        class="ml-3 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        on:click={handleDepositClick}
      >
        Deposit
      </a>

      <!-- Account dropdown -->
      <div class="relative ml-3">
        <button
          class="hidden sm:inline-flex shrink-0 whitespace-nowrap text-sm text-muted-foreground hover:text-foreground"
          aria-haspopup="menu"
          aria-expanded={openMenu}
          on:click={() => (openMenu = !openMenu)}
        >
          My Account
        </button>

        <button
          class="ml-2 inline-flex sm:hidden items-center justify-center rounded-md border border-border bg-card p-2"
          aria-label="Account"
          aria-haspopup="menu"
          aria-expanded={openMenu}
          on:click={() => (openMenu = !openMenu)}
        >
          <UserRound class="h-4 w-4" />
        </button>

        {#if openMenu}
          <div
            class="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover shadow-lg p-1 text-sm"
            role="menu"
            tabindex="-1"
            on:keydown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                openMenu = false;
              }
            }}
            on:focusout={(e) => {
              const r = e.currentTarget as HTMLElement;
              if (!r.contains(e.relatedTarget as Node)) openMenu = false;
            }}
          >
            <a
              href="/account"
              class="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-accent hover:text-accent-foreground"
              role="menuitem"
              on:click={() => (openMenu = false)}
            >
              <UserRound class="h-4 w-4" />
              <span>Profile</span>
            </a>

            <div class="my-1 h-px bg-border/70"></div>

            <form method="post" action="/logout">
              <button
                type="submit"
                class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-red-500 hover:bg-accent hover:text-red-600"
                role="menuitem"
              >
                <LogOut class="h-4 w-4" />
                <span>Logout</span>
              </button>
            </form>
          </div>
        {/if}
      </div>
    {:else}
      <!-- Right actions when NOT authed -->
      <a
        href="/login"
        class="ml-2 hidden sm:inline-flex rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
        >Log In</a
      >
      <a
        href="/login"
        class="ml-2 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
        >Sign Up</a
      >
      <a
        href="/login"
        class="ml-2 inline-flex sm:hidden items-center justify-center rounded-md border border-border bg-card p-2"
        aria-label="Log In"
      >
        <LogIn class="h-4 w-4" />
      </a>
      <a
        href="/login"
        class="ml-2 inline-flex md:hidden rounded-md bg-primary px-2 py-2 text-xs text-primary-foreground hover:opacity-90"
        >Sign Up</a
      >
    {/if}
  </div>
</header>
