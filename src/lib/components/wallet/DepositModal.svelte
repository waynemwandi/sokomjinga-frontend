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

  const quickAmounts = [1000, 5000, 10000, 25000];

  const handleQuickAmount = (val: number) => {
    localAmount = String(val);
  };

  const close = () => {
    stopPolling();
    state = "idle";
    message = null;
    localAmount = "";
    dispatch("close");
  };

  async function handleSubmit() {
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
    <!-- Backdrop -->
    <button
      type="button"
      aria-label="Close deposit modal"
      class="absolute inset-0 bg-foreground/50"
      on:click={close}
    ></button>

    <!-- Modal -->
    <div
      class="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold">Deposit Cash</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-muted"
          on:click={close}
        >
          Close
        </button>
      </div>

      <!-- IDLE STATE -->
      {#if state === "idle"}
        <form on:submit|preventDefault={handleSubmit} class="space-y-4">
          <div>
            <label for="deposit-amount" class="text-xs text-muted-foreground">
              Amount (KES)
            </label>
            <input
              id="deposit-amount"
              type="number"
              min="1"
              step="1"
              bind:value={localAmount}
              class="mt-1 w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <p class="text-xs text-muted-foreground mb-1">Quick amounts</p>
            <div class="grid grid-cols-4 gap-2">
              {#each quickAmounts as val}
                <button
                  type="button"
                  on:click={() => handleQuickAmount(val)}
                  class="rounded-md bg-input px-2 py-1.5 text-xs hover:bg-muted"
                >
                  {(val / 1000).toFixed(0)}K
                </button>
              {/each}
            </div>
          </div>

          <div class="flex justify-end gap-2">
            <button
              type="button"
              class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-muted"
              on:click={close}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-md border border-border bg-primary/20 px-3 py-1.5 text-sm text-primary hover:bg-primary/30"
            >
              Deposit
            </button>
          </div>
        </form>
      {/if}

      <!-- SUBMITTING -->
      {#if state === "submitting"}
        <p class="text-sm text-muted-foreground">
          Initiating M-Pesa request...
        </p>
      {/if}

      <!-- WAITING FOR STK -->
      {#if state === "waiting_stk"}
        <div class="space-y-2">
          <p class="text-sm font-medium">Check your phone.</p>
          <p class="text-sm text-muted-foreground">
            Enter your M-Pesa PIN to complete the deposit.
          </p>
        </div>
      {/if}

      <!-- SUCCESS -->
      {#if state === "success"}
        <p class="text-sm text-emerald-500 font-medium">Deposit successful.</p>
      {/if}

      <!-- FAILED -->
      {#if state === "failed"}
        <p class="text-sm text-red-500">
          {message}
        </p>
      {/if}

      <!-- TIMEOUT -->
      {#if state === "timeout"}
        <p class="text-sm text-yellow-500">
          {message}
        </p>
      {/if}
    </div>
  </div>
{/if}
