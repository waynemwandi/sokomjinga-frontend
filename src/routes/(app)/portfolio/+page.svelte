<!-- src/routes/(app)/portfolio/+page.svelte -->
<script lang="ts">
  import type { PageData } from "./$types";
  import DepositModal from "$lib/components/wallet/DepositModal.svelte";
  import { page } from "$app/stores";

  export let data: PageData;

  const wallet = data.wallet;
  const positions = data.positions;
  const bets = data.bets ?? [];

  // ---- Derived numbers ------------------------------------------------
  const availableBalanceKes = (wallet?.balance_cents ?? 0) / 100;
  const inActiveBetsKes = (positions?.totals?.stake_cents ?? 0) / 100;
  const activeBetsCount = positions?.positions?.length ?? 0;

  const wins = bets.filter((b: any) => b.result === "correct").length;
  const losses = bets.filter((b: any) => b.result === "incorrect").length;
  const totalStakeKes =
    bets.reduce((sum: number, b: any) => sum + (b.stake_cents ?? 0), 0) / 100;
  const winRate = bets.length > 0 ? Math.round((wins / bets.length) * 100) : 0;

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

    <!-- Quick stats -->
    <div class="space-y-3">
      <div class="rounded-xl border border-border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground mb-1">
          Active bets
        </p>
        <p class="text-2xl font-semibold">{activeBetsCount}</p>
      </div>
      <div class="rounded-xl border border-border bg-card p-4">
        <p class="text-xs font-medium text-muted-foreground mb-1">Win rate</p>
        <p
          class="text-2xl font-semibold {wins > losses
            ? 'text-emerald-500'
            : wins === 0
              ? ''
              : 'text-amber-500'}"
        >
          {winRate}%
        </p>
      </div>
    </div>
  </section>

  <!-- Transaction / prediction history -->
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold">Prediction history</h2>
    </div>

    {#if !bets || bets.length === 0}
      <p class="text-sm text-muted-foreground">
        You have no predictions yet. Once you place bets, they will appear here.
      </p>
    {:else}
      <div class="overflow-x-auto rounded-lg border border-border">
        <table class="min-w-full text-sm">
          <thead class="bg-card/60">
            <tr class="text-left">
              <th class="px-3 py-2 font-medium">Date</th>
              <th class="px-3 py-2 font-medium">Market</th>
              <th class="px-3 py-2 font-medium">Side</th>
              <th class="px-3 py-2 font-medium">Result</th>
              <th class="px-3 py-2 font-medium text-right">Stake (KES)</th>
            </tr>
          </thead>
          <tbody>
            {#each bets as bet (bet.id)}
              <tr class="border-t border-border hover:bg-muted/40">
                <td class="px-3 py-2 align-top">
                  <span class="text-xs text-muted-foreground">
                    {formatDate(bet.created_at)}
                  </span>
                </td>
                <td class="px-3 py-2 align-top">
                  <div class="text-sm font-medium">
                    {bet.title}
                  </div>
                  {#if bet.category}
                    <div class="mt-0.5 text-[11px] text-muted-foreground">
                      {bet.category}
                    </div>
                  {/if}
                </td>
                <td class="px-3 py-2 align-top">
                  <span
                    class="text-xs font-semibold {bet.prediction === 'yes'
                      ? 'text-emerald-500'
                      : bet.prediction === 'no'
                        ? 'text-red-500'
                        : 'text-muted-foreground'}"
                  >
                    {bet.prediction}
                  </span>
                </td>
                <td class="px-3 py-2 align-top">
                  {#if bet.result === "correct"}
                    <span
                      class="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500"
                    >
                      Won
                    </span>
                  {:else if bet.result === "incorrect"}
                    <span
                      class="inline-flex items-center rounded-full border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-500"
                    >
                      Lost
                    </span>
                  {:else if bet.result === "cancelled"}
                    <span
                      class="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      Cancelled
                    </span>
                  {:else}
                    <span
                      class="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-500"
                    >
                      Pending
                    </span>
                  {/if}
                </td>
                <td class="px-3 py-2 align-top text-right">
                  <span class="text-sm font-semibold">
                    {formatShortKES((bet.stake_cents ?? 0) / 100)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Footer stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div class="rounded-lg border border-border bg-card p-3">
          <p class="text-xs font-medium text-muted-foreground mb-1">
            Total wagered
          </p>
          <p class="font-semibold">
            {formatShortKES(totalStakeKes)}
          </p>
        </div>
        <div class="rounded-lg border border-border bg-card p-3">
          <p class="text-xs font-medium text-muted-foreground mb-1">Wins</p>
          <p class="font-semibold text-emerald-500">
            {wins}
          </p>
        </div>
        <div class="rounded-lg border border-border bg-card p-3">
          <p class="text-xs font-medium text-muted-foreground mb-1">Losses</p>
          <p class="font-semibold text-red-500">
            {losses}
          </p>
        </div>
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
