<!-- src/lib/components/layout/AppHeader.svelte -->

<script lang="ts">
  import { toggleTheme } from "$lib/theme";
  import {
    ChartNoAxesCombined,
    Sun,
    Moon,
    LogIn,
    LogOut,
    Menu,
    UserRound,
    Info,
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

  $: portfolioAmount = portfolioLabel
    ? portfolioLabel.replace("Portfolio ", "")
    : "KES 0.00";

  let showHowItWorks = false;
  let step = 1;
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
    <div class="ml-auto flex items-center gap-3">
      <!-- Theme toggle (ALWAYS VISIBLE) -->
      <button
        class="inline-flex h-9 w-9 items-center justify-center
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
          class="hidden md:flex flex-col items-start px-2 leading-tight"
        >
          <span class="text-[11px] text-muted-foreground"> Portfolio </span>
          <span class="text-sm font-semibold text-emerald-500">
            {portfolioAmount}
          </span>
        </a>

        <!-- Portfolio (MOBILE – compact, no overflow) -->
        <a
          href={portfolioHref}
          class="md:hidden text-sm font-semibold text-emerald-500 px-2 truncate max-w-[140px]"
        >
          {portfolioAmount}
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
            <Menu class="h-4 w-4" />
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
        <button
          class="hidden sm:inline-flex items-center gap-2 text-sm text-muted-foreground px-2 hover:text-foreground"
          on:click={() => {
            showHowItWorks = true;
            step = 1;
          }}
        >
          <Info class="h-4 w-4 text-blue-500" />
          How it works
        </button>

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
  </div>
</header>

{#if showHowItWorks}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div
      class="w-full max-w-md overflow-hidden rounded-xl border border-border bg-card shadow-xl"
    >
      <!-- IMAGE -->
      <div class="relative h-48 w-full bg-muted">
        <img
          src={step === 1
            ? "/how-step-1.png"
            : step === 2
              ? "/how-step-2.png"
              : "/how-step-3.png"}
          alt="Step illustration"
          class="h-full w-full object-cover"
        />
        <div
          class="absolute inset-0 bg-gradient-to-b from-transparent to-card"
        ></div>
      </div>

      <!-- CONTENT -->
      <div class="p-6">
        <!-- HEADER -->
        <div class="flex items-start justify-between">
          <h2 class="text-2xl font-bold">
            {#if step === 1}
              <span class="text-primary">1.</span> Pick a Market
            {:else if step === 2}
              <span class="text-primary">2.</span> Place a Trade
            {:else}
              <span class="text-primary">3.</span> Redeem
            {/if}
          </h2>

          <button
            class="text-muted-foreground hover:text-foreground"
            on:click={() => (showHowItWorks = false)}
          >
            ✕
          </button>
        </div>

        <!-- BODY -->
        <div
          class="mt-4 text-sm text-muted-foreground space-y-3 leading-relaxed"
        >
          {#if step === 1}
            <p>Choose a Yes or No market based on your view of the outcome.</p>
            <p>Prices move in real time as other traders buy and sell.</p>
          {:else if step === 2}
            <p>Select the number of shares you want to buy.</p>
            <p>
              Your potential payout depends on the price at the time of
              purchase.
            </p>
          {:else}
            <p>When the market resolves, each winning share pays out.</p>
            <p>You can track performance in your portfolio at any time.</p>
          {/if}
        </div>

        <!-- CTA -->
        <div class="mt-6 flex justify-end">
          {#if step < 3}
            <button
              class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              on:click={() => step++}
            >
              Next
            </button>
          {:else}
            <button
              class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
              on:click={() => {
                showHowItWorks = false;
                if (!isAuthed) goto("/login");
              }}
            >
              Get Started
            </button>
          {/if}
        </div>

        <!-- TERMS -->
        {#if step === 3}
          <div class="mt-6 text-xs text-muted-foreground text-center">
            Trading is subject to eligibility requirements and our
            <a href="/terms" class="underline hover:text-foreground">
              Terms and Conditions
            </a>.
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
