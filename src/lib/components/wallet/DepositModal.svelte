<!-- src/lib/components/wallet/DepositModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let open = false;
  export let error: string | null = null;
  export let amount: string | number | null = null;

  const dispatch = createEventDispatcher();

  let localAmount: string = amount != null ? String(amount) : "";

  const quickAmounts = [1000, 5000, 10000, 25000];

  // Keep local input in sync with server-sent value
  $: if (amount != null) {
    localAmount = String(amount);
  }

  const onBackdropClick = () => {
    dispatch("close");
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      dispatch("close");
    }
  };

  const handleQuickAmount = (val: number) => {
    localAmount = String(val);
  };
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    tabindex="-1"
    on:keydown={handleKeyDown}
  >
    <!-- Backdrop -->
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={onBackdropClick}
    ></button>

    <!-- Modal card -->
    <div
      class="relative w-full max-w-md rounded-xl border border-border bg-card p-4 md:p-6 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Deposit Cash"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-base md:text-lg font-semibold">Deposit Cash</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-muted"
          on:click={() => dispatch("close")}
        >
          Close
        </button>
      </div>

      {#if error}
        <p class="mb-3 text-sm text-red-500">{error}</p>
      {/if}

      <form method="POST" action="?/deposit" class="space-y-4">
        <!-- Amount Input -->
        <div class="grid gap-1.5">
          <label for="amount" class="text-xs font-medium text-muted-foreground">
            Amount (KES)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="1"
            bind:value={localAmount}
            placeholder="Enter amount"
            class="rounded-md border border-border bg-input px-3 py-2 text-sm"
            required
          />
        </div>

        <!-- Quick Amounts -->
        <div class="grid gap-1.5">
          <p class="text-xs font-semibold text-muted-foreground">
            Quick amounts
          </p>
          <div class="grid grid-cols-4 gap-2">
            {#each quickAmounts as val}
              <button
                type="button"
                on:click={() => handleQuickAmount(val)}
                class="rounded-md bg-input px-2 py-1.5 text-xs hover:bg-muted transition"
              >
                {(val / 1000).toFixed(0)}K
              </button>
            {/each}
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-2 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-muted"
            on:click={() => dispatch("close")}
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-md border border-border bg-primary/20 px-3 py-1.5 text-sm text-primary hover:bg-primary/30 disabled:opacity-50"
            disabled={!localAmount || Number(localAmount) <= 0}
          >
            Deposit
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
