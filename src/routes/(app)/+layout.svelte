<!-- src/routes/(app)/+layout.svelte -->
<script lang="ts">
  let sidebarOpen = false;
  let showHowItWorks = false;
  const SIDEBAR_W = "280px";

  import {
    Sun,
    Moon,
    ChartNoAxesCombined,
    LayoutDashboard,
    Store,
    Wallet,
    BanknoteArrowUp,
    Activity,
  } from "lucide-svelte";
  import { page } from "$app/state";
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import AccountMenu from "$lib/components/layout/AccountMenu.svelte";
  import HowItWorksModal from "$lib/components/layout/HowItWorksModal.svelte";

  // comes from +layout.server.ts (it already returns { me })
  export let data: {
    me: { email: string; name?: string; role?: string; is_admin?: boolean };
    portfolioLabel?: string | null;
  };

  const isAdmin =
    (data.me as any)?.is_admin === true || (data.me as any)?.role === "admin";

  const navClass = (href: string, path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
      path === href || path.startsWith(href + "/")
        ? "border border-border bg-white text-zinc-950 shadow-sm dark:border-white dark:bg-white dark:text-zinc-950"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;

  const toggleThemeFromButton = async () => {
    const { toggleTheme } = await import("$lib/theme");
    toggleTheme();
  };
</script>

{#if isAdmin}
  <!-- ===========================
       ADMIN SHELL
  ============================ -->
  <div class="min-h-screen bg-background text-foreground">
    <!-- Mobile header -->
    <header
      class="md:hidden sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur"
    >
      <div class="h-14 flex items-center gap-3 px-4">
        <button
          class="rounded-md bg-neutral px-3 py-1.5 text-sm"
          on:click={() => (sidebarOpen = true)}
          aria-label="Open sidebar"
        >
          Menu
        </button>
        <div class="ml-2 text-sm text-muted-foreground">Admin</div>

        <!-- Mobile account button -->
        <div class="ml-auto">
          <AccountMenu
            trigger="user"
            onHowItWorks={() => (showHowItWorks = true)}
          />
        </div>
      </div>
    </header>

    <!-- Desktop grid -->
    <div
      class="md:grid"
      style={`grid-template-columns:${SIDEBAR_W} 1fr; grid-template-rows: 56px auto;`}
    >
      <!-- Sidebar (desktop) -->
      <aside
        class="hidden md:block row-span-2 sticky top-0 h-[100dvh] border-r border-border bg-zinc-50/90 backdrop-blur dark:bg-card/60"
      >
        <a
          href="/"
          class="mx-3 mt-3 flex items-center gap-2 rounded-xl px-3 py-3 hover:bg-accent"
        >
          <div
            class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
          >
            <ChartNoAxesCombined class="size-4" />
          </div>
          <span class="text-sm font-semibold">MaoniMarket</span>
        </a>

        <div class="px-6 pb-3 pt-5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Operations
        </div>

        <nav class="px-3 space-y-1 text-sm">
          <a
            href="/admin/dashboard"
            class={navClass("/admin/dashboard", page.url.pathname)}
            ><LayoutDashboard class="size-4" />Dashboard</a
          >
          <a
            href="/admin/markets"
            class={navClass("/admin/markets", page.url.pathname)}
            ><Store class="size-4" />Markets</a
          >
          <a
            href="/admin/wallets"
            class={navClass("/admin/wallets", page.url.pathname)}
            ><Wallet class="size-4" />Wallets</a
          >
          <a
            href="/admin/withdrawals"
            class={navClass("/admin/withdrawals", page.url.pathname)}
            ><BanknoteArrowUp class="size-4" />Withdrawals</a
          >
          <a
            href="/admin/api-status"
            class={navClass("/admin/api-status", page.url.pathname)}
            ><Activity class="size-4" />API Status</a
          >
        </nav>

        <div
          class="absolute bottom-0 w-[280px] p-3 text-xs text-muted-foreground"
        >
          {data.me?.email}
        </div>
      </aside>

      <!-- Header (desktop) -->
      <header
        class="hidden md:flex col-start-2 col-end-3 items-center border-b border-border bg-card/40 backdrop-blur"
      >
        <div
          class="mx-auto w-full max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] px-4 xl:px-6 2xl:px-8 h-14 flex items-center gap-3"
        >
          <div class="text-sm text-muted-foreground">Admin Dashboard</div>
          <div class="ml-auto flex items-center gap-3">
            <button
              class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-input hover:bg-card transition"
              on:click={toggleThemeFromButton}
              aria-label="Toggle theme"
            >
              <Sun
                class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
              />
              <Moon
                class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
              />
            </button>

            <input
              class="w-72 rounded-md bg-input px-3 py-1.5 text-sm placeholder-neutral focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search..."
            />

            <!-- Account dropdown (desktop) -->
            <AccountMenu
              trigger="text"
              onHowItWorks={() => (showHowItWorks = true)}
            />
          </div>
        </div>
      </header>

      <!-- Main -->
      <main class="col-start-1 md:col-start-2 col-end-3">
        <div
          class="mx-auto w-full max-w-[100%] px-4 py-6 md:max-w-[1400px] lg:max-w-[1600px] 2xl:max-w-[1800px] md:px-6 xl:px-8 2xl:px-10"
        >
          <slot />
        </div>
      </main>
    </div>

    <!-- Mobile drawer -->
    {#if sidebarOpen}
      <div class="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
        <div
          class="w-[72%] max-w-[320px] h-full border-r border-border bg-zinc-50 dark:bg-card"
        >
          <div class="p-4 flex items-center justify-between">
            <a
              href="/"
              class="flex items-center gap-2 hover:bg-accent rounded-md"
              on:click={() => (sidebarOpen = false)}
            >
              <div
                class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
              >
                <ChartNoAxesCombined class="size-4" />
              </div>
              <span class="text-sm font-semibold">MaoniMarket</span>
            </a>

            <button
              class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card transition-colors"
              on:click={() => (sidebarOpen = false)}
              type="button"
            >
              Close
            </button>
          </div>

          <div class="px-5 pb-3 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Operations
          </div>

          <nav class="px-3 space-y-1 text-sm">
            <a
              href="/admin/dashboard"
              class={navClass("/admin/dashboard", page.url.pathname)}
              on:click={() => (sidebarOpen = false)}
            >
              <LayoutDashboard class="size-4" />Dashboard
            </a>

            <a
              href="/admin/markets"
              class={navClass("/admin/markets", page.url.pathname)}
              on:click={() => (sidebarOpen = false)}
            >
              <Store class="size-4" />Markets
            </a>

            <a
              href="/admin/wallets"
              class={navClass("/admin/wallets", page.url.pathname)}
              on:click={() => (sidebarOpen = false)}
            >
              <Wallet class="size-4" />Wallets
            </a>

            <a
              href="/admin/withdrawals"
              class={navClass("/admin/withdrawals", page.url.pathname)}
              on:click={() => (sidebarOpen = false)}
            >
              <BanknoteArrowUp class="size-4" />Withdrawals
            </a>

            <a
              href="/admin/api-status"
              class={navClass("/admin/api-status", page.url.pathname)}
              on:click={() => (sidebarOpen = false)}
            >
              <Activity class="size-4" />API Status
            </a>
          </nav>
        </div>

        <!-- Clickable overlay to close -->
        <button
          type="button"
          class="flex-1 bg-foreground/50"
          aria-label="Close sidebar"
          on:click={() => (sidebarOpen = false)}
          on:keydown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              sidebarOpen = false;
            }
          }}
        ></button>
      </div>
    {/if}

    {#if showHowItWorks}
      <HowItWorksModal
        isAuthed={true}
        onClose={() => (showHowItWorks = false)}
      />
    {/if}
  </div>
{:else}
  <!-- ===========================
       NON-ADMIN APP SHELL
       (used for /account, /portfolio, etc.)
  ============================ -->
  <div class="min-h-screen bg-background text-foreground">
    <AppHeader
      isAuthed={true}
      portfolioLabel={data.portfolioLabel ?? undefined}
    />

    <main>
      <div
        class="mx-auto w-full max-w-[100%] px-4 py-6 md:max-w-[1400px] lg:max-w-[1600px] 2xl:max-w-[1800px] md:px-6 xl:px-8 2xl:px-10"
      >
        <slot />
      </div>
    </main>
  </div>
{/if}
