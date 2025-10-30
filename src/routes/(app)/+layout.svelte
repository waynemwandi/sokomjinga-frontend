<script lang="ts">
  let sidebarOpen = false;
  let openMenu = false; // account dropdown state
  const SIDEBAR_W = "280px";

  import { toggleTheme } from "$lib/theme";
  import { Sun, Moon, ChartNoAxesCombined, UserRound } from "lucide-svelte";
  import { page } from "$app/state";

  // comes from +layout.server.ts (it already returns { me })
  export let data: { me: { email: string; name?: string } };

  const navClass = (href: string, path: string) =>
    `block rounded px-3 py-2 transition-colors ${
      path === href || path.startsWith(href + "/")
        ? "bg-accent/70 text-foreground"
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    }`;
</script>

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
      <div class="ml-auto relative">
        <button
          class="inline-flex items-center justify-center rounded-md border border-border bg-card p-2"
          aria-label="Account"
          aria-haspopup="menu"
          aria-expanded={openMenu}
          on:click={() => (openMenu = !openMenu)}
        >
          <UserRound class="h-4 w-4" />
        </button>

        {#if openMenu}
          <div
            class="absolute right-0 mt-2 w-40 rounded-md border border-border bg-popover shadow-md z-50"
            role="menu"
            on:focusout={(e) => {
              const r = e.currentTarget as HTMLElement;
              if (!r.contains(e.relatedTarget as Node)) openMenu = false;
            }}
          >
            <a
              href="/account"
              class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
              role="menuitem"
              on:click={() => (openMenu = false)}
            >
              Profile
            </a>
            <form method="post" action="/logout">
              <button
                type="submit"
                class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-accent"
                role="menuitem"
              >
                Logout
              </button>
            </form>
          </div>
        {/if}
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
      class="hidden md:block row-span-2 sticky top-0 h-[100dvh] border-r border-border bg-card/60 backdrop-blur"
    >
      <div class="flex items-center gap-2 p-4">
        <div
          class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
        >
          <ChartNoAxesCombined class="size-4" />
        </div>
        <span class="text-sm font-semibold">SokoMjinga</span>
      </div>

      <nav class="px-2 space-y-1 text-sm">
        <a
          href="/admin/dashboard"
          class={navClass("/admin/dashboard", page.url.pathname)}>Dashboard</a
        >
        <a
          href="/admin/markets"
          class={navClass("/admin/markets", page.url.pathname)}>Markets</a
        >
        <a
          href="/admin/wallets"
          class={navClass("/admin/wallets", page.url.pathname)}>Wallets</a
        >
        <a
          href="/admin/reports"
          class={navClass("/admin/reports", page.url.pathname)}>Reports</a
        >
        <a
          href="/admin/api-status"
          class={navClass("/admin/api-status", page.url.pathname)}>API Status</a
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

          <input
            class="w-72 rounded-md bg-input px-3 py-1.5 text-sm placeholder-neutral focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search..."
          />

          <!-- Account dropdown (desktop) - same UX as home -->
          <div
            class="relative"
            on:keydown={(e) => {
              if (e.key === "Escape") openMenu = false;
            }}
          >
            <button
              class="inline-flex text-xs text-muted-foreground hover:text-foreground"
              aria-haspopup="menu"
              aria-expanded={openMenu}
              on:click={() => (openMenu = !openMenu)}
            >
              My Account
            </button>

            {#if openMenu}
              <div
                class="absolute right-0 mt-2 w-40 rounded-md border border-border bg-popover shadow-md z-50"
                role="menu"
                on:focusout={(e) => {
                  const r = e.currentTarget as HTMLElement;
                  if (!r.contains(e.relatedTarget as Node)) openMenu = false;
                }}
              >
                <a
                  href="/account"
                  class="block px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  role="menuitem"
                  on:click={() => (openMenu = false)}
                >
                  Profile
                </a>
                <form method="post" action="/logout">
                  <button
                    type="submit"
                    class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-accent"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </form>
              </div>
            {/if}
          </div>
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
    <div
      class="fixed inset-0 z-50 flex"
      on:click={() => (sidebarOpen = false)}
      aria-hidden="true"
    >
      <div
        class="w-[72%] max-w-[320px] h-full border-r border-border bg-card"
        on:click|stopPropagation
      >
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
            >
              <ChartNoAxesCombined class="size-4" />
            </div>
            <span class="text-sm font-semibold">SokoMjinga</span>
          </div>
          <button
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card transition-colors"
            on:click={() => (sidebarOpen = false)}
          >
            Close
          </button>
        </div>

        <nav class="px-2 space-y-1 text-sm">
          <a
            href="/admin/dashboard"
            class={navClass("/admin/dashboard", page.url.pathname)}>Dashboard</a
          >
          <a
            href="/admin/markets"
            class={navClass("/admin/markets", page.url.pathname)}>Markets</a
          >
          <a
            href="/admin/wallets"
            class={navClass("/admin/wallets", page.url.pathname)}>Wallets</a
          >
          <a
            href="/admin/reports"
            class={navClass("/admin/reports", page.url.pathname)}>Reports</a
          >
          <a
            href="/admin/api-status"
            class={navClass("/admin/api-status", page.url.pathname)}
            >API Status</a
          >
        </nav>
      </div>
      <div class="flex-1 bg-foreground/50"></div>
    </div>
  {/if}
</div>
