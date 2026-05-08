<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Wallet } from "$lib/api";

  export let open = false;
  export let balanceCents = 0;

  const dispatch = createEventDispatcher();
  const minimumCents = 100_00;

  let amount = "";
  let loading = false;
  let error: string | null = null;
  let success = false;

  $: maxWithdrawCents = Math.max(0, balanceCents - minimumCents);
  $: maxWithdrawKes = Math.floor(maxWithdrawCents / 100);

  const formatKES = (cents: number) =>
    `KES ${(cents / 100).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  function reset() {
    amount = "";
    loading = false;
    error = null;
    success = false;
  }

  function close() {
    reset();
    dispatch("close");
  }

  async function submit() {
    const amountKes = Number(amount);
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      error = "Enter a valid amount.";
      return;
    }

    const amountCents = Math.round(amountKes * 100);
    if (amountCents > maxWithdrawCents) {
      error = `You can withdraw up to ${formatKES(maxWithdrawCents)}.`;
      return;
    }

    loading = true;
    error = null;
    try {
      await Wallet.withdraw({ amount_cents: amountCents });
      success = true;
      dispatch("success");
      setTimeout(close, 1400);
    } catch (e: any) {
      const message = e?.message || "";
      if (message.includes("Phone number not configured")) {
        error = "Add your M-Pesa phone number in Profile first.";
      } else if (message.includes("withdrawal in progress")) {
        error = "You already have a withdrawal in progress.";
      } else if (message.includes("KES 100")) {
        error = "KES 100 stays available for account activity.";
      } else {
        error = "Withdrawal request failed. Please try again.";
      }
    } finally {
      loading = false;
    }
  }
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      aria-label="Close withdrawal modal"
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      on:click={close}
    ></button>

    <div
      class="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Withdraw cash"
    >
      <div class="border-b border-border px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Wallet
            </p>
            <h2 class="mt-1 text-xl font-semibold">Withdraw cash</h2>
          </div>
          <button
            type="button"
            class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-muted"
            on:click={close}
          >
            Close
          </button>
        </div>
      </div>

      <div class="space-y-5 px-6 py-5">
        <div class="rounded-xl border border-border bg-background/50 p-4">
          <p class="text-xs text-muted-foreground">Available to withdraw</p>
          <p class="mt-1 text-2xl font-semibold">
            {formatKES(maxWithdrawCents)}
          </p>
          <p class="mt-2 text-xs text-muted-foreground">
            KES 100 stays available for account activity.
          </p>
        </div>

        {#if success}
          <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-300">
            Withdrawal request received.
          </div>
        {:else}
          <form on:submit|preventDefault={submit} class="space-y-4">
            <div>
              <div class="flex items-center justify-between">
                <label for="withdraw-amount" class="text-sm text-muted-foreground">
                  Amount
                </label>
                <span class="text-xs text-muted-foreground">KES</span>
              </div>
              <input
                id="withdraw-amount"
                type="number"
                min="1"
                max={maxWithdrawKes}
                step="1"
                bind:value={amount}
                class="mt-2 w-full rounded-xl border border-border bg-input px-4 py-4 text-right text-2xl font-semibold outline-none transition focus:border-primary"
                placeholder="0"
              />
            </div>

            <div class="flex flex-wrap gap-2">
              {#each [100, 500, 1000, maxWithdrawKes] as quick}
                {#if quick > 0}
                  <button
                    type="button"
                    class="rounded-md bg-input px-3 py-1.5 text-xs hover:bg-muted"
                    on:click={() => (amount = String(quick))}
                  >
                    {quick === maxWithdrawKes ? "Max" : `KES ${quick}`}
                  </button>
                {/if}
              {/each}
            </div>

            {#if error}
              <p class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {error}
              </p>
            {/if}

            <button
              type="submit"
              disabled={loading || maxWithdrawCents <= 0}
              class="w-full rounded-xl border border-primary bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-md disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Request withdrawal"}
            </button>
          </form>
        {/if}
      </div>
    </div>
  </div>
{/if}
