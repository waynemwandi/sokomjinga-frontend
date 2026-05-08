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
    withdrawals: {
      id: string;
      user_id: string;
      email: string;
      name: string | null;
      amount_cents: number;
      currency: string;
      status: string;
      mpesa_phone: string | null;
      mpesa_reference: string | null;
      reason: string | null;
      created_at: string;
      updated_at: string;
    }[];
    withdrawalsTotal: number;
    withdrawalPage: number;
    withdrawalStatus: string;
  };

  const s = data.summary;
  const page = data.page ?? 0;
  const withdrawalPage = data.withdrawalPage ?? 0;
  const withdrawalStatus = data.withdrawalStatus ?? "pending";

  const formatKES = (cents: number) => `KES ${(cents / 100).toLocaleString()}`;

  const prettyType = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const prettyStatus = (status: string) =>
    status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const statusClass = (status: string) => {
    if (status === "pending") return "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30";
    if (status === "processing") return "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30";
    if (status === "completed") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30";
    return "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30";
  };
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

<!-- Withdrawal Queue -->
<div class="mt-6 rounded-xl border border-border bg-card/80 p-5 shadow-sm">
  <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div>
      <h2 class="text-base font-semibold tracking-tight">Withdrawal queue</h2>
      <p class="text-xs text-muted-foreground">
        Manual M-Pesa requests waiting for admin processing.
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      {#each ["pending", "processing", "completed", "failed", "all"] as status}
        <a
          href={`?withdrawalStatus=${status}`}
          class="rounded-md border border-border px-3 py-1.5 text-xs transition
            {withdrawalStatus === status
              ? 'bg-primary text-primary-foreground'
              : 'bg-input hover:bg-muted'}"
        >
          {status === "all" ? "All" : prettyStatus(status)}
        </a>
      {/each}
    </div>
  </div>

  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="min-w-full text-sm">
      <thead class="bg-card/60">
        <tr class="text-left">
          <th class="px-3 py-2 font-medium">Customer</th>
          <th class="px-3 py-2 font-medium">Phone</th>
          <th class="px-3 py-2 font-medium text-right">Amount</th>
          <th class="px-3 py-2 font-medium">Status</th>
          <th class="px-3 py-2 font-medium">Requested</th>
          <th class="px-3 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#if data.withdrawals.length === 0}
          <tr>
            <td colspan="6" class="px-3 py-6 text-center text-sm text-muted-foreground">
              No withdrawal requests found.
            </td>
          </tr>
        {:else}
          {#each data.withdrawals as w (w.id)}
            <tr class="border-t border-border align-top">
              <td class="px-3 py-3">
                <div class="font-medium">{w.name || "No name"}</div>
                <div class="text-xs text-muted-foreground">{w.email}</div>
              </td>
              <td class="px-3 py-3 font-mono text-xs">
                {w.mpesa_phone || "â€”"}
              </td>
              <td class="px-3 py-3 text-right font-semibold">
                {formatKES(w.amount_cents)}
              </td>
              <td class="px-3 py-3">
                <span class={`inline-flex rounded-md border px-2 py-0.5 text-xs ${statusClass(w.status)}`}>
                  {prettyStatus(w.status)}
                </span>
                {#if w.reason}
                  <div class="mt-1 max-w-56 text-xs text-muted-foreground">
                    {w.reason}
                  </div>
                {/if}
                {#if w.mpesa_reference}
                  <div class="mt-1 text-xs text-muted-foreground">
                    Ref: {w.mpesa_reference}
                  </div>
                {/if}
              </td>
              <td class="px-3 py-3 text-xs text-muted-foreground">
                {new Date(w.created_at).toLocaleString()}
              </td>
              <td class="px-3 py-3">
                <div class="flex min-w-[360px] flex-wrap justify-end gap-2">
                  {#if w.status === "pending"}
                    <form method="POST" action="?/updateWithdrawal">
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="status" value="processing" />
                      <button
                        class="rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
                      >
                        Start
                      </button>
                    </form>
                  {/if}

                  {#if w.status === "pending" || w.status === "processing"}
                    <form method="POST" action="?/updateWithdrawal" class="flex gap-1">
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="status" value="completed" />
                      <input
                        name="mpesa_reference"
                        placeholder="M-Pesa ref"
                        class="w-28 rounded-md border border-border bg-input px-2 py-1 text-xs"
                      />
                      <button
                        class="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                      >
                        Send
                      </button>
                    </form>

                    <form method="POST" action="?/updateWithdrawal" class="flex gap-1">
                      <input type="hidden" name="id" value={w.id} />
                      <input type="hidden" name="status" value="failed" />
                      <input
                        name="reason"
                        placeholder="Reason"
                        class="w-28 rounded-md border border-border bg-input px-2 py-1 text-xs"
                      />
                      <button
                        class="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-600 hover:bg-red-500/20 dark:text-red-300"
                      >
                        Reject
                      </button>
                    </form>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>

  <div class="mt-4 flex items-center justify-between text-sm">
    <a
      href={`?withdrawalStatus=${withdrawalStatus}&withdrawalsPage=${Math.max(0, withdrawalPage - 1)}`}
      class="rounded-md border px-3 py-1 {withdrawalPage === 0
        ? 'pointer-events-none opacity-40'
        : ''}"
    >
      Previous
    </a>

    <span class="text-neutral">
      Page {withdrawalPage + 1}
    </span>

    <a
      href={`?withdrawalStatus=${withdrawalStatus}&withdrawalsPage=${withdrawalPage + 1}`}
      class="rounded-md border px-3 py-1 {(withdrawalPage + 1) * 10 >= data.withdrawalsTotal
        ? 'pointer-events-none opacity-40'
        : ''}"
    >
      Next
    </a>
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
