<!-- src/lib/components/wallet/DepositModal.svelte -->
<script lang="ts">
  import { createEventDispatcher, onDestroy } from "svelte";
  import { Wallet, getJSON } from "$lib/api";

  export let open = false;

  const dispatch = createEventDispatcher();

  type DepositState =
    | "idle"
    | "submitting"
    | "waiting_stk"
    | "success"
    | "failed"
    | "timeout";

  let state: DepositState = "idle";
  let localAmount = "";
  let message: string | null = null;
  let depositId: string | null = null;
  let pollTimer: any = null;

  const quickAmounts = [100, 500, 1000, 2500];

  const handleQuickAmount = (val: number) => {
    localAmount = String(val);
  };

  const formatKES = (amount: string | number) => {
    const numeric = Number(amount || 0);
    return `KES ${numeric.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const close = () => {
    stopPolling();
    state = "idle";
    message = null;
    localAmount = "";
    dispatch("close");
  };

  async function handleSubmit() {
    if (state !== "idle") return;
    if (!localAmount || Number(localAmount) <= 0) return;

    state = "submitting";
    message = null;

    try {
      const amount_cents = Math.round(Number(localAmount) * 100);

      // PRODUCTION STK FLOW
      const created = await Wallet.depositSTK({ amount_cents });

      depositId = created.id;
      state = "waiting_stk";

      startPolling();
    } catch (e: any) {
      if (e.message?.includes("Phone number not configured")) {
        message = "Please add your phone number in Profile before depositing.";
      } else {
        message = "Deposit failed. Please try again.";
      }
      state = "failed";
    }
  }

  async function pollDeposit() {
    if (!depositId) return;

    try {
      const data = await getJSON<{
        id: string;
        status: string;
      }>(`/wallet/deposits/${depositId}`);

      if (data.status === "confirmed") {
        state = "success";
        stopPolling();
        dispatch("success");
        setTimeout(close, 1500);
      }

      if (data.status === "stk_failed") {
        state = "failed";
        message = "M-Pesa transaction failed or was cancelled.";
        stopPolling();
      }
    } catch {
      // ignore transient errors
    }
  }

  function startPolling() {
    let elapsed = 0;

    pollTimer = setInterval(() => {
      elapsed += 2;
      pollDeposit();

      if (elapsed >= 60) {
        state = "timeout";
        message =
          "We could not confirm the payment. If you entered your PIN, it may still process.";
        stopPolling();
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  onDestroy(() => {
    stopPolling();
  });
</script>

{#if open}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <button
      type="button"
      aria-label="Close deposit modal"
      class="absolute inset-0 bg-black/60 backdrop-blur-sm"
      on:click={close}
    ></button>

    <div
      class="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Deposit cash"
    >
      <div class="border-b border-border px-6 py-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              M-Pesa STK
            </p>
            <h2 class="mt-1 text-xl font-semibold">Deposit cash</h2>
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

      <div class="px-6 py-5">
        {#if state === "idle"}
          <form on:submit|preventDefault={handleSubmit} class="space-y-5">
            <div class="rounded-xl border border-border bg-background/50 p-4">
              <div class="flex items-center justify-between">
                <label for="deposit-amount" class="text-sm text-muted-foreground">
                  Amount
                </label>
                <span class="text-xs text-muted-foreground">KES</span>
              </div>
              <input
                id="deposit-amount"
                type="number"
                min="1"
                step="1"
                bind:value={localAmount}
                class="mt-2 w-full rounded-xl border border-border bg-input px-4 py-4 text-right text-2xl font-semibold outline-none transition focus:border-primary"
                placeholder="0"
                required
              />
              {#if localAmount}
                <p class="mt-2 text-right text-xs text-muted-foreground">
                  You will receive an STK prompt for {formatKES(localAmount)}.
                </p>
              {/if}
            </div>

            <div>
              <p class="text-xs text-muted-foreground mb-2">Quick amounts</p>
              <div class="grid grid-cols-4 gap-2">
              {#each quickAmounts as val}
                <button
                  type="button"
                  on:click={() => handleQuickAmount(val)}
                  class="rounded-md bg-input px-2 py-2 text-xs hover:bg-muted"
                >
                  {val >= 1000 ? `${val / 1000}K` : val}
                </button>
              {/each}
              </div>
            </div>

            <button
              type="submit"
              disabled={!localAmount || Number(localAmount) <= 0}
              class="action-button action-button-primary w-full rounded-xl px-4 py-3"
            >
              Send M-Pesa prompt
            </button>
          </form>
        {/if}

        {#if state === "submitting"}
          <div class="rounded-xl border border-border bg-background/50 p-4">
            <p class="text-sm font-medium">Sending M-Pesa prompt...</p>
            <p class="mt-1 text-sm text-muted-foreground">
              Keep your phone nearby.
            </p>
          </div>
        {/if}

        {#if state === "waiting_stk"}
          <div class="space-y-4">
            <div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <p class="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                Check your phone
              </p>
              <p class="mt-1 text-sm text-muted-foreground">
                Enter your M-Pesa PIN to complete the deposit.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
              <div class="rounded-lg bg-input p-2">Prompt sent</div>
              <div class="rounded-lg bg-input p-2">Enter PIN</div>
              <div class="rounded-lg bg-input p-2">Confirming</div>
            </div>
          </div>
        {/if}

        {#if state === "success"}
          <p class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">
            Deposit successful.
          </p>
        {/if}

        {#if state === "failed"}
          <p class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
            {message}
          </p>
        {/if}

        {#if state === "timeout"}
          <p class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
            {message}
          </p>
        {/if}
      </div>
    </div>
  </div>
{/if}
