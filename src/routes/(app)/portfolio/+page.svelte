<!-- src/routes/(app)/portfolio/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import DepositModal from "$lib/components/wallet/DepositModal.svelte";
  import { page } from "$app/stores";

  export let data: PageData;

  const wallet = data.wallet;
  const positions = data.positions;
  const statement = data.statement?.items ?? [];

  // ---- Derived numbers ------------------------------------------------
  const availableBalanceKes = (wallet?.balance_cents ?? 0) / 100;
  const inActiveBetsKes = (positions?.totals?.stake_cents ?? 0) / 100;
  const activeBetsCount = positions?.positions?.length ?? 0;

  let depositOpen = Boolean(data.openDeposit);
  let depositError: string | null = null;
  let depositAmount: string | number | null = null;

  $: {
    const params = $page.url.searchParams;

    if (params.has("deposit")) {
      depositOpen = true;
    }

    const amt = params.get("amount");
    if (amt) {
      depositAmount = amt;
    }
  }

  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)}`;

  const formatShortKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE").format(v)}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
</script>

<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6 space-y-6">
  <!-- Header -->
  <section class="space-y-1">
    <h1 class="text-2xl md:text-3xl font-semibold">Portfolio</h1>
    <p class="text-sm text-muted-foreground">
      View your wallet balance, open positions, and prediction history.
    </p>
  </section>

  <!-- Balance + quick stats -->
  <section class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <!-- Balance card -->
    <div class="lg:col-span-2">
      <div
        class="relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm"
      >
        <div class="mb-6 flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1">
              Available balance
            </p>
            <p class="text-3xl md:text-4xl font-semibold">
              {formatKES(availableBalanceKes)}
            </p>
          </div>
          <span
            class="inline-flex items-center rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
          >
            Active
          </span>
        </div>

        <div
          class="mb-6 border-t border-border/70 pt-4 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3"
        >
          <div>
            <p class="text-xs font-medium text-muted-foreground mb-1">
              In open positions
            </p>
            <p class="text-xl font-semibold">
              {formatKES(inActiveBetsKes)}
            </p>
          </div>
          <div class="text-xs text-muted-foreground">
            <span class="font-medium">{activeBetsCount}</span> active bets
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            class="flex-1 rounded-md border border-border bg-primary/20 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/30 transition"
            on:click={() => {
              depositOpen = true;
              depositError = null;
            }}
          >
            Deposit cash
          </button>
          <button
            type="button"
            class="flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm font-medium hover:bg-muted transition"
            disabled
            aria-disabled="true"
            title="Withdrawals coming soon"
          >
            Withdraw (soon)
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Transaction / prediction history -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Wallet statement</h2>
    </div>

    {#if !statement || statement.length === 0}
      <p class="text-sm text-muted-foreground">
        No transactions yet. Deposits and settlements will appear here.
      </p>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-border">
        <table class="min-w-full text-sm">
          <thead class="bg-card/60">
            <tr class="text-left">
              <th class="px-3 py-2 font-medium">Date</th>
              <th class="px-3 py-2 font-medium">Type</th>
              <th class="px-3 py-2 font-medium">Reference</th>
              <th class="px-3 py-2 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each statement as item (item.id)}
              <tr class="border-t border-border hover:bg-muted/40">
                <td class="px-3 py-2">
                  <span class="text-xs text-muted-foreground">
                    {formatDate(item.created_at)}
                  </span>
                </td>

                <td class="px-3 py-2">
                  <span class="text-sm font-medium">
                    {item.kind}
                  </span>
                </td>

                <td class="px-3 py-2">
                  {#if item.mpesa_reference}
                    <span class="text-xs text-muted-foreground">
                      MPESA: {item.mpesa_reference}
                    </span>
                  {:else}
                    <span class="text-xs text-muted-foreground"> — </span>
                  {/if}
                </td>

                <td class="px-3 py-2 text-right">
                  <span
                    class="font-semibold {item.direction === 'in'
                      ? 'text-emerald-500'
                      : 'text-red-500'}"
                  >
                    {item.direction === "in" ? "+" : "-"}
                    {formatShortKES(Math.abs(item.signed_amount_cents / 100))}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Deposit modal -->
  <DepositModal
    open={depositOpen}
    error={depositError}
    amount={depositAmount}
    on:close={() => (depositOpen = false)}
  />
</main>
