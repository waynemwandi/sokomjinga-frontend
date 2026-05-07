<!-- src/lib/components/layout/AppHeader.svelte -->

<script lang="ts">
  import {
    ChartNoAxesCombined,
    Info,
    X,
  } from "lucide-svelte";
  import { goto } from "$app/navigation";
  import { PUBLIC_API_BASE } from "$env/static/public";
  import { searchQuery } from "$lib/stores/search";
  import { portfolio } from "$lib/stores/portfolio";
  import AccountMenu from "./AccountMenu.svelte";
  import AuthModal from "./AuthModal.svelte";
  import HowItWorksModal from "./HowItWorksModal.svelte";

  export let portfolioLabel: string | null = null;

  $: displayValue =
    $portfolio > 0
      ? `KES ${$portfolio.toLocaleString("en-KE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : (portfolioLabel?.replace("Portfolio ", "") ?? "KES 0.00");

  export let isAuthed: boolean;
  // export let portfolioLabel: string = "Portfolio KES 0.00";
  export let portfolioHref: string = "/portfolio";
  export let depositHref: string = "/portfolio?deposit=1";

  const handleDepositClick = (event: MouseEvent) => {
    event.preventDefault();
    const stamp = Date.now();
    goto(`/portfolio?deposit=${stamp}`);
  };

  let showHowItWorks = false;
  let showAuthModal = false;
  let hideHowItWorksBar = false;

  let query = "";
  const googleStartUrl = `${PUBLIC_API_BASE.replace(/\/+$/, "")}/auth/google/start`;

  $: searchQuery.set(query);
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

    <!-- Search (DESKTOP) -->
    <div class="ml-3 flex-1 hidden sm:block">
      <input
        bind:value={query}
        class="w-full sm:w-[360px] md:w-[480px] lg:w-[560px]
      rounded-md border border-border bg-input px-3 py-2 text-sm
      placeholder-muted-foreground focus:outline-none
      focus:ring-2 focus:ring-ring"
        placeholder="Search markets"
      />
    </div>
    <div class="ml-auto flex items-center gap-3">
      {#if isAuthed}
        <!-- Portfolio (DESKTOP) -->
        <a
          href={portfolioHref}
          class="hidden md:flex flex-col items-start px-2 leading-tight"
        >
          <span class="text-[11px] text-muted-foreground"> Portfolio </span>
          <span class="text-sm font-semibold text-emerald-500">
            {displayValue}
          </span>
        </a>

        <!-- Portfolio (MOBILE – compact, no overflow) -->
        <a
          href={portfolioHref}
          class="md:hidden text-sm font-semibold text-emerald-500 px-2 truncate max-w-[140px]"
        >
          {displayValue}
        </a>

        <!-- Deposit (DESKTOP ONLY) -->
        <a
          href={depositHref}
          class="hidden md:inline-flex rounded-md bg-primary
               px-3 py-2 text-sm text-primary-foreground hover:opacity-90"
          onclick={handleDepositClick}
        >
          Deposit
        </a>

        <!-- Account -->
        <div class="ml-1">
          <AccountMenu
            trigger="menu"
            onHowItWorks={() => (showHowItWorks = true)}
          />
        </div>
      {:else}
        <!-- NOT AUTHED -->
        <button
          class="hidden sm:inline-flex items-center gap-2 text-sm text-muted-foreground px-2 hover:text-foreground"
          onclick={() => {
            showHowItWorks = true;
          }}
        >
          <Info class="h-4 w-4 text-muted-foreground" />
          How it works
        </button>

        <button
          type="button"
          class="inline-flex rounded-md border border-border
         bg-card px-3 py-2 text-sm hover:bg-accent transition"
          onclick={() => (showAuthModal = true)}
        >
          Log In
        </button>

        <button
          type="button"
          class="inline-flex rounded-md bg-primary
            px-3 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
          onclick={() => (showAuthModal = true)}
        >
          Sign Up
        </button>
      {/if}
    </div>
  </div>
</header>

{#if !isAuthed && !hideHowItWorksBar}
  <div
    class="fixed bottom-16 left-0 right-0 z-40 sm:hidden
      border-t border-border bg-background/95 backdrop-blur"
  >
    <div class="relative h-12 flex items-center justify-center px-4 text-sm">
      <button
        class="flex items-center gap-2 text-primary font-medium"
        onclick={() => {
          showHowItWorks = true;
        }}
      >
        <Info class="h-4 w-4" />
        How it works
      </button>

      <button
        class="absolute right-4 inline-flex h-8 w-8 items-center justify-center
          rounded-md border border-border bg-card hover:bg-accent transition"
        onclick={() => (hideHowItWorksBar = true)}
        aria-label="Close"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
{/if}

{#if showHowItWorks}
  <HowItWorksModal {isAuthed} onClose={() => (showHowItWorks = false)} />
{/if}

{#if showAuthModal}
  <AuthModal {googleStartUrl} onClose={() => (showAuthModal = false)} />
{/if}
