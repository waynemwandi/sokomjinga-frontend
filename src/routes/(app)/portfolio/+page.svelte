<!-- src/routes/(app)/portfolio/+page.svelte -->
<script lang="ts">
  import type { PageData, ActionData } from "./$types";
  import DepositModal from "$lib/components/wallet/DepositModal.svelte";
  import { page } from "$app/stores";

  export let data: PageData;
  export let form: ActionData;

  const formatKES = (cents: number) => (cents / 100).toFixed(2);

  $: wallet = data.wallet;
  $: bets = data.bets ?? [];

  // open modal if query has ?deposit=1 or user clicks button
  let showDeposit =
    $page.url.searchParams.get("deposit") === "1" ? true : false;

  const openDeposit = () => {
    showDeposit = true;
  };

  const closeDeposit = () => {
    showDeposit = false;
    // remove ?deposit=1 from URL without reload
    const url = new URL(window.location.href);
    url.searchParams.delete("deposit");
    window.history.replaceState({}, "", url);
  };

  $: depositError = form?.error ?? null;
  $: depositAmount = form?.amount ?? null;

  $: depositSuccess = $page.url.searchParams.get("deposit_success") === "1";
</script>

<svelte:head>
  <title>Portfolio – SokoMjinga</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6">
  <header
    class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
  >
    <div>
      <h1 class="text-2xl font-semibold text-white">Portfolio</h1>
      <p class="text-sm text-neutral-400">
        View your wallet balance and recent activity.
      </p>
    </div>

    <div class="flex items-center gap-4">
      <div class="text-right">
        <div class="text-xs uppercase tracking-wide text-neutral-400">
          Wallet balance
        </div>
        <div class="text-lg font-semibold text-emerald-400">
          KES {formatKES(wallet.balance_cents)}
        </div>
      </div>
      <button
        type="button"
        class="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        on:click={openDeposit}
      >
        Deposit
      </button>
    </div>
  </header>

  {#if depositSuccess}
    <div
      class="rounded-md border border-emerald-700 bg-emerald-900/40 px-4 py-3 text-sm text-emerald-200"
    >
      Deposit request submitted. In production, this would show after you
      approve the Safaricom STK push.
    </div>
  {/if}

  <section class="rounded-xl bg-neutral-900/80 p-4 shadow">
    <h2 class="mb-3 text-sm font-semibold text-neutral-200">
      Prediction history
    </h2>

    {#if bets.length === 0}
      <p class="text-sm text-neutral-500">
        No bets placed yet. Once you place a prediction, it will show up here.
      </p>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full text-left text-sm">
          <thead
            class="border-b border-neutral-800 text-xs uppercase text-neutral-400"
          >
            <tr>
              <th class="py-2 pr-4">Date</th>
              <th class="py-2 pr-4">Market</th>
              <th class="py-2 pr-4">Side</th>
              <th class="py-2 pr-4">Result</th>
              <th class="py-2 pr-4 text-right">Stake (KES)</th>
            </tr>
          </thead>
          <tbody>
            {#each bets as b}
              <tr
                class="border-b border-neutral-900/60 hover:bg-neutral-900/70"
              >
                <td class="py-2 pr-4 text-neutral-200">
                  {new Date(b.created_at).toLocaleString()}
                </td>
                <td class="py-2 pr-4 text-neutral-200">
                  {b.title}
                </td>
                <td class="py-2 pr-4 text-neutral-300">
                  {b.prediction}
                </td>
                <td class="py-2 pr-4 text-neutral-300">
                  {b.result}
                </td>
                <td class="py-2 pr-4 text-right text-neutral-200">
                  KES {formatKES(b.stake_cents)}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>

<DepositModal
  open={showDeposit}
  error={depositError}
  amount={depositAmount}
  on:close={closeDeposit}
/>
