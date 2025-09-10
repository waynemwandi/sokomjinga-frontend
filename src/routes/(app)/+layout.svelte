<script lang="ts">
  let sidebarOpen = false;
  const SIDEBAR_W = '280px';

  import { toggleTheme } from '$lib/theme';
  import { Sun, Moon, GalleryVerticalEndIcon } from 'lucide-svelte';
</script>


<div class="min-h-screen bg-background text-foreground">
  <!-- Mobile header (shows sidebar toggle) -->
  <header class="md:hidden sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
    <div class="h-14 flex items-center gap-3 px-4">
      <button
        class="rounded-md bg-neutral px-3 py-1.5 text-sm"
        on:click={() => (sidebarOpen = true)}
        aria-label="Open sidebar"
      >
        Menu
      </button>
      <div class="ml-2 text-sm text-muted-foreground">Admin</div>

      <div class="ml-auto h-7 w-7 rounded-full bg-input"></div>
    </div>
  </header>

  <!-- Desktop grid -->
  <div
    class="md:grid"
    style={`grid-template-columns:${SIDEBAR_W} 1fr; grid-template-rows: 56px auto;`}
  >
    <!-- Sidebar (desktop) -->
    <aside class="hidden md:block row-span-2 sticky top-0 h-[100dvh] border-r border-border bg-card/60 backdrop-blur">
      <div class="flex items-center gap-2 p-4">
          <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEndIcon class="size-4" />
          </div>
          <span class="text-sm font-semibold">SokoMjinga</span>
        </div>
      <nav class="px-2 space-y-1 text-sm">
        <!-- Active item example -->
        <a
          href="/admin/dashboard"
          data-active="true"
          class="block rounded px-3 py-2 bg-accent/70 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Dashboard
        </a>

        <!-- Normal items -->
        <a
          href="/admin/markets"
          class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Markets
        </a>
        <a
          href="/admin/wallets"
          class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Wallets
        </a>
        <a
          href="/admin/reports"
          class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Reports
        </a>
      </nav>

      <div class="absolute bottom-0 w-[280px] p-3 text-xs text-muted-foreground">
        mwandiwayne@gmail.com
      </div>
    </aside>


    <!-- Header (desktop) -->
    <header class="hidden md:flex col-start-2 col-end-3 items-center border-b border-border bg-card/40 backdrop-blur">  
      <div class="mx-auto w-full max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] px-4 xl:px-6 2xl:px-8 h-14 flex items-center gap-3">
        <div class="text-sm text-muted-foreground">Admin Dashboard</div>
        <div class="ml-auto flex items-center gap-2">
          <button
            class="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-input hover:bg-card transition"
            on:click={toggleTheme}
            aria-label="Toggle theme"
          >
            <Sun class="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon class="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </button>
          <input
            class="w-72 rounded-md bg-input px-3 py-1.5 text-sm placeholder-neutral focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search..."
          />
          <a href="/" class="text-xs text-muted-foreground hover:text-foreground">My Account</a>
          <div class="h-7 w-7 rounded-full bg-input"></div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="col-start-1 md:col-start-2 col-end-3">
      <div class="mx-auto w-full max-w-[100%] px-4 py-6 md:max-w-[1400px] lg:max-w-[1600px] 2xl:max-w-[1800px] md:px-6 xl:px-8 2xl:px-10">
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
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- Drawer panel -->
      <div
        class="w-[72%] max-w-[320px] h-full border-r border-border bg-card"
        on:click|stopPropagation
      >
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
              <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEndIcon class="size-4" />
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
          <!-- active item (example) -->
          <a
            href="/admin/dashboard"
            data-active="true"
            class="block rounded px-3 py-2 bg-accent/70 text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            on:click={() => (sidebarOpen = false)}
          >
            Dashboard
          </a>

          <!-- normal items -->
          <a
            href="/admin/markets"
            class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            on:click={() => (sidebarOpen = false)}
          >
            Markets
          </a>
          <a
            href="/admin/wallets"
            class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            on:click={() => (sidebarOpen = false)}
          >
            Wallets
          </a>
          <a
            href="/admin/reports"
            class="block rounded px-3 py-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            on:click={() => (sidebarOpen = false)}
          >
            Reports
          </a>
        </nav>
      </div>

      <!-- Scrim -->
      <div class="flex-1 bg-foreground/50"></div>
      
    </div>
  {/if}

</div>
