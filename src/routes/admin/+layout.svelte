<script lang="ts">
  let sidebarOpen = false;
  const SIDEBAR_W = '280px';
</script>

<div class="min-h-screen bg-neutral-950 text-neutral-100">
  <!-- Mobile header (shows sidebar toggle) -->
  <header class="md:hidden sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur">
    <div class="h-14 flex items-center gap-3 px-4">
      <button
        class="rounded-md bg-neutral-800 px-3 py-1.5 text-sm"
        on:click={() => (sidebarOpen = true)}
        aria-label="Open sidebar"
      >
        Menu
      </button>
      <div class="ml-2 text-sm text-neutral-300">Admin</div>
      <div class="ml-auto h-7 w-7 rounded-full bg-neutral-700"></div>
    </div>
  </header>

  <!-- Desktop grid -->
  <div
    class="md:grid"
    style={`grid-template-columns:${SIDEBAR_W} 1fr; grid-template-rows: 56px auto;`}
  >
    <!-- Sidebar (desktop) -->
    <aside
      class="hidden md:block row-span-2 sticky top-0 h-[100dvh] border-r border-neutral-800 bg-neutral-900/60 backdrop-blur"
    >
      <div class="p-4 text-sm font-semibold">Acme Inc.</div>
      <nav class="px-2 space-y-1 text-sm">
        <a href="/admin" class="block rounded px-3 py-2 hover:bg-neutral-800">Dashboard</a>
        <a href="/admin/markets" class="block rounded px-3 py-2 hover:bg-neutral-800">Markets</a>
        <a href="/admin/wallets" class="block rounded px-3 py-2 hover:bg-neutral-800">Wallets</a>
        <a href="/admin/reports" class="block rounded px-3 py-2 hover:bg-neutral-800">Reports</a>
      </nav>
      <div class="absolute bottom-0 w-[280px] p-3 text-xs text-neutral-400">m@example.com</div>
    </aside>

    <!-- Header (desktop) -->
    <header class="hidden md:flex col-start-2 col-end-3 items-center border-b border-neutral-800 bg-neutral-900/40 backdrop-blur">
      <div class="mx-auto w-full max-w-[1400px] xl:max-w-[1600px] 2xl:max-w-[1800px] px-4 xl:px-6 2xl:px-8 h-14 flex items-center gap-3">
        <div class="text-sm text-neutral-400">Documents</div>
        <div class="ml-auto flex items-center gap-2">
          <input
            class="w-72 rounded-md bg-neutral-800/70 px-3 py-1.5 text-sm placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            placeholder="Search..."
          />
          <a href="https://github.com" target="_blank" class="text-xs text-neutral-400 hover:text-neutral-200">GitHub</a>
          <div class="h-7 w-7 rounded-full bg-neutral-700"></div>
        </div>
      </div>
    </header>

    <!-- Main -->
    <main class="col-start-1 md:col-start-2 col-end-3">
      <!-- On mobile we want full-width; on desktop we center and widen on large screens -->
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
      <div class="w-[72%] max-w-[320px] h-full border-r border-neutral-800 bg-neutral-900"
           on:click|stopPropagation>
        <div class="p-4 flex items-center justify-between">
          <div class="text-sm font-semibold">Acme Inc.</div>
          <button class="rounded-md bg-neutral-800 px-3 py-1.5 text-sm" on:click={() => (sidebarOpen = false)}>
            Close
          </button>
        </div>
        <nav class="px-2 space-y-1 text-sm">
          <a href="/admin" class="block rounded px-3 py-2 hover:bg-neutral-800" on:click={() => (sidebarOpen = false)}>Dashboard</a>
          <a href="/admin/markets" class="block rounded px-3 py-2 hover:bg-neutral-800" on:click={() => (sidebarOpen = false)}>Markets</a>
          <a href="/admin/wallets" class="block rounded px-3 py-2 hover:bg-neutral-800" on:click={() => (sidebarOpen = false)}>Wallets</a>
          <a href="/admin/reports" class="block rounded px-3 py-2 hover:bg-neutral-800" on:click={() => (sidebarOpen = false)}>Reports</a>
        </nav>
      </div>
      <div class="flex-1 bg-black/50"></div>
    </div>
  {/if}
</div>
