<!-- src\routes\(app)\admin\wallets\+page.svelte -->
<script lang="ts">
  export let data: {
    summary: {
      total_wallets: number;
      user_wallets: number;
      system_wallets: number;
      total_available_cents: number;
      total_pending_cents: number;
      currency: string;
    } | null;
    byType: {
      type: string;
      count: number;
      available_cents: number;
      pending_cents: number;
    }[];
    wallets: {
      id: string;
      type: string;
      user_id: string | null;
      available_cents: number;
      pending_cents: number;
      created_at: string;
      updated_at: string;
    }[];
    total: number;
    page: number;
  };

  const s = data.summary;
  const page = data.page ?? 0;

  const formatKES = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  const prettyType = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
</script>

<h1 class="text-xl font-semibold mb-4">Wallets</h1>

<!-- KPI Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  <div
    class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
  >
    <div class="text-xs text-neutral">Total wallets</div>
    <div class="mt-2 flex items-baseline gap-2">
      <div class="text-2xl font-semibold">
        {s?.total_wallets ?? "—"}
      </div>
    </div>
  </div>

  <div
    class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
  >
    <div class="text-xs text-neutral">User wallets</div>
    <div class="mt-2 flex items-baseline gap-2">
      <div class="text-2xl font-semibold">
        {s?.user_wallets ?? "—"}
      </div>
    </div>
  </div>

  <div
    class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
  >
    <div class="text-xs text-neutral">System wallets</div>
    <div class="mt-2 flex items-baseline gap-2">
      <div class="text-2xl font-semibold">
        {s?.system_wallets ?? "—"}
      </div>
    </div>
  </div>

  <div
    class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
  >
    <div class="text-xs text-neutral">Available balance</div>
    <div class="mt-2 flex items-baseline gap-2">
      <div class="text-2xl font-semibold">
        {s ? formatKES(s.total_available_cents) : "—"}
      </div>
    </div>
  </div>
</div>

<!-- Wallets by Type -->
<div class="mt-6 rounded-xl border bg-neutral p-5">
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-base font-semibold tracking-tight">Wallets by type</h2>
    <span class="text-xs text-neutral/60"> Distribution and balances </span>
  </div>

  {#if data.byType.length === 0}
    <div class="text-sm text-neutral">No wallet data available</div>
  {:else}
    <div class="space-y-3">
      {#each data.byType as row}
        <div
          class="flex items-center justify-between rounded-lg border border-neutral/60 px-4 py-3"
        >
          <div>
            <div class="text-sm font-medium">
              {prettyType(row.type)}
            </div>
            <div class="text-xs text-neutral/60">
              {row.count} wallets
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm font-semibold">
              {formatKES(row.available_cents)}
            </div>
            <div class="text-xs text-neutral/60">
              pending {formatKES(row.pending_cents)}
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- Recent Wallet Activity -->
<!-- ===========================
  Wallets Table
=========================== -->
<div class="mt-6 overflow-x-auto rounded-lg border border-border">
  <table class="min-w-full text-sm">
    <thead class="bg-card/60">
      <tr class="text-left">
        <th class="px-3 py-2 font-medium">Wallet ID</th>
        <th class="px-3 py-2 font-medium">Type</th>
        <th class="px-3 py-2 font-medium">Owner</th>
        <th class="px-3 py-2 font-medium text-right">Available</th>
        <th class="px-3 py-2 font-medium text-right">Pending</th>
        <th class="px-3 py-2 font-medium">Created</th>
        <th class="px-3 py-2 font-medium text-right">Actions</th>
      </tr>
    </thead>

    <tbody>
      {#if data.wallets.length === 0}
        <tr>
          <td
            colspan="7"
            class="px-3 py-6 text-center text-sm text-muted-foreground"
          >
            No wallets found.
          </td>
        </tr>
      {:else}
        {#each data.wallets as w (w.id)}
          <tr class="border-t border-border">
            <td class="px-3 py-2 font-mono text-xs">
              {w.id.slice(0, 8)}…
            </td>

            <td class="px-3 py-2">
              <span
                class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs bg-input"
              >
                {prettyType(w.type)}
              </span>
            </td>

            <td class="px-3 py-2 text-xs text-muted-foreground">
              {w.user_id ? w.user_id.slice(0, 8) + "…" : "System"}
            </td>

            <td class="px-3 py-2 text-right font-medium">
              {formatKES(w.available_cents)}
            </td>

            <td class="px-3 py-2 text-right text-muted-foreground">
              {formatKES(w.pending_cents)}
            </td>

            <td class="px-3 py-2 text-xs text-muted-foreground">
              {new Date(w.created_at).toLocaleString()}
            </td>

            <td class="px-3 py-2">
              <div class="flex justify-end gap-2">
                <a
                  href={`/admin/wallets/${w.id}`}
                  class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card transition"
                >
                  View
                </a>

                <button
                  class="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
                >
                  Freeze
                </button>
              </div>
            </td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</div>

<!-- Pagination -->
<div class="mt-4 flex items-center justify-between text-sm">
  <a
    href={`?page=${Math.max(0, page - 1)}`}
    class="rounded-md border px-3 py-1 {page === 0
      ? 'pointer-events-none opacity-40'
      : ''}"
  >
    Previous
  </a>

  <span class="text-neutral">
    Page {page + 1}
  </span>

  <a
    href={`?page=${page + 1}`}
    class="rounded-md border px-3 py-1 {(page + 1) * 10 >= data.total
      ? 'pointer-events-none opacity-40'
      : ''}"
  >
    Next
  </a>
</div>
