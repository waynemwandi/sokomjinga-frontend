<script lang="ts">
  import { enhance } from "$app/forms";

  export let data: {
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
    total: number;
    page: number;
    pageSize: number;
    status: string;
  };

  $: withdrawals = Array.isArray(data?.withdrawals) ? data.withdrawals : [];
  $: page = data.page ?? 0;
  $: pageSize = data.pageSize ?? 10;
  $: status = data.status ?? "pending";
  $: total = data.total ?? 0;
  $: totalPages = Math.max(1, Math.ceil(total / pageSize));
  $: totalAmount = withdrawals.reduce((sum, w) => sum + w.amount_cents, 0);
  let activeWithdrawalAction: string | null = null;

  const formatKES = (cents: number) =>
    `KES ${(cents / 100).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const prettyStatus = (value: string) =>
    value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const statusClass = (value: string) => {
    if (value === "pending") return "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30";
    if (value === "processing") return "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/30";
    if (value === "completed") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30";
    return "bg-red-500/10 text-red-600 dark:text-red-300 border-red-500/30";
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  function withdrawalEnhance(id: string, action: string) {
    return ({ cancel }: { cancel: () => void }) => {
      if (activeWithdrawalAction) {
        cancel();
        return;
      }

      activeWithdrawalAction = `${id}:${action}`;

      return async ({ update }: { update: () => Promise<void> }) => {
        try {
          await update();
        } finally {
          activeWithdrawalAction = null;
        }
      };
    };
  }
</script>

<div class="space-y-8">
  <div>
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Withdrawals</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Manual M-Pesa requests waiting for review and payout.
      </p>
    </div>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Shown requests</p>
      <p class="mt-3 text-3xl font-semibold tracking-tight">
        {withdrawals.length}
      </p>
      <p class="mt-2 text-xs text-muted-foreground">
        {prettyStatus(status)} filter
      </p>
    </div>
    <div class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Amount in view</p>
      <p class="mt-3 text-3xl font-semibold tracking-tight">
        {formatKES(totalAmount)}
      </p>
      <p class="mt-2 text-xs text-muted-foreground">Use this for Safaricom batching</p>
    </div>
    <div class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
      <p class="text-sm text-muted-foreground">Queue control</p>
      <p class="mt-3 text-3xl font-semibold tracking-tight">
        {total}
      </p>
      <p class="mt-2 text-xs text-muted-foreground">Total matching requests</p>
    </div>
  </div>

  <section class="rounded-xl border border-border bg-card/80 shadow-sm">
    <div
      class="flex flex-col gap-4 border-b border-border/60 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Withdrawal queue</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Start review, send cash, or reject and return funds.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        {#each ["pending", "processing", "completed", "failed", "all"] as option}
          <a
            href={`?status=${option}&page=0`}
            data-sveltekit-noscroll
            class="rounded-md border border-border px-3 py-1.5 text-xs transition
              {status === option
                ? 'bg-primary text-primary-foreground'
                : 'bg-input hover:bg-muted'}"
          >
            {option === "all" ? "All" : prettyStatus(option)}
          </a>
        {/each}
      </div>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full min-w-[1050px] text-left text-sm">
        <thead class="border-b border-border/60 text-xs text-muted-foreground">
          <tr>
            <th class="px-5 py-3 font-medium">Customer</th>
            <th class="px-5 py-3 font-medium">Phone</th>
            <th class="px-5 py-3 text-right font-medium">Amount</th>
            <th class="px-5 py-3 font-medium">Status</th>
            <th class="px-5 py-3 font-medium">Requested</th>
            <th class="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border/60">
          {#if withdrawals.length === 0}
            <tr>
              <td colspan="6" class="px-5 py-10 text-center text-sm text-muted-foreground">
                No withdrawal requests found.
              </td>
            </tr>
          {:else}
            {#each withdrawals as w (w.id)}
              <tr class="align-top">
                <td class="px-5 py-4">
                  <div class="font-medium">{w.name || "No name"}</div>
                  <div class="mt-1 text-xs text-muted-foreground">{w.email}</div>
                </td>
                <td class="px-5 py-4 font-mono text-xs">
                  {w.mpesa_phone || "-"}
                </td>
                <td class="px-5 py-4 text-right font-semibold">
                  {formatKES(w.amount_cents)}
                </td>
                <td class="px-5 py-4">
                  <span class={`inline-flex rounded-md border px-2 py-0.5 text-xs ${statusClass(w.status)}`}>
                    {prettyStatus(w.status)}
                  </span>
                  {#if w.reason}
                    <div class="mt-2 max-w-64 text-xs text-muted-foreground">
                      {w.reason}
                    </div>
                  {/if}
                  {#if w.mpesa_reference}
                    <div class="mt-2 text-xs text-muted-foreground">
                      Ref: {w.mpesa_reference}
                    </div>
                  {/if}
                </td>
                <td class="px-5 py-4 text-xs text-muted-foreground">
                  {formatDate(w.created_at)}
                </td>
                <td class="px-5 py-4">
                  <div class="flex min-w-[380px] flex-wrap justify-end gap-2">
                    {#if w.status === "pending"}
                      <form
                        method="POST"
                        action="?/updateWithdrawal"
                        use:enhance={withdrawalEnhance(w.id, "processing")}
                      >
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value="processing" />
                        <button
                          disabled={Boolean(activeWithdrawalAction)}
                          class="action-button border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-500/20 dark:text-blue-300"
                        >
                          {#if activeWithdrawalAction === `${w.id}:processing`}
                            <span class="action-spinner"></span>
                          {/if}
                          {activeWithdrawalAction === `${w.id}:processing`
                            ? "Starting..."
                            : "Start"}
                        </button>
                      </form>
                    {/if}

                    {#if w.status === "pending" || w.status === "processing"}
                      <form
                        method="POST"
                        action="?/updateWithdrawal"
                        class="flex gap-1"
                        use:enhance={withdrawalEnhance(w.id, "completed")}
                      >
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value="completed" />
                        <input
                          name="mpesa_reference"
                          placeholder="M-Pesa ref"
                          class="w-32 rounded-md border border-border bg-input px-2 py-1.5 text-xs"
                        />
                        <button
                          disabled={Boolean(activeWithdrawalAction)}
                          class="action-button border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-300"
                        >
                          {#if activeWithdrawalAction === `${w.id}:completed`}
                            <span class="action-spinner"></span>
                          {/if}
                          {activeWithdrawalAction === `${w.id}:completed`
                            ? "Sending..."
                            : "Send"}
                        </button>
                      </form>

                      <form
                        method="POST"
                        action="?/updateWithdrawal"
                        class="flex gap-1"
                        use:enhance={withdrawalEnhance(w.id, "failed")}
                      >
                        <input type="hidden" name="id" value={w.id} />
                        <input type="hidden" name="status" value="failed" />
                        <input
                          name="reason"
                          placeholder="Reason"
                          class="w-32 rounded-md border border-border bg-input px-2 py-1.5 text-xs"
                        />
                        <button
                          disabled={Boolean(activeWithdrawalAction)}
                          class="action-button action-button-danger px-3 py-1.5 text-xs"
                        >
                          {#if activeWithdrawalAction === `${w.id}:failed`}
                            <span class="action-spinner"></span>
                          {/if}
                          {activeWithdrawalAction === `${w.id}:failed`
                            ? "Rejecting..."
                            : "Reject"}
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

    <div
      class="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm"
    >
      <a
        href={`?status=${status}&page=${Math.max(0, page - 1)}`}
        data-sveltekit-noscroll
        class={`rounded-md border border-border px-3 py-1.5 transition ${
          page === 0 ? "pointer-events-none opacity-40" : "hover:bg-accent"
        }`}
      >
        Previous
      </a>

      <span class="text-muted-foreground">
        Page {page + 1} of {totalPages}
      </span>

      <a
        href={`?status=${status}&page=${page + 1}`}
        data-sveltekit-noscroll
        class={`rounded-md border border-border px-3 py-1.5 transition ${
          (page + 1) * pageSize >= total
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent"
        }`}
      >
        Next
      </a>
    </div>
  </section>
</div>
