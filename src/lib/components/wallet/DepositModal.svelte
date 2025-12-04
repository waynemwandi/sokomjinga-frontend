<!-- src/lib/components/wallet/DepositModal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";

  export let open = false;
  export let error: string | null = null;
  export let amount: string | number | null = null;

  const dispatch = createEventDispatcher();

  let submitting = false;

  const handleBackdropClick = (event: MouseEvent) => {
    if (event.target === event.currentTarget && !submitting) {
      dispatch("close");
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && !submitting) {
      event.stopPropagation();
      dispatch("close");
    }
  };

  const handleSubmit = () => {
    // after this, the browser will POST to ?/deposit and then follow
    // the redirect from the action – we just flip UI into "waiting" mode
    submitting = true;
  };
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/60"
    role="presentation"
    tabindex="-1"
    on:click={handleBackdropClick}
    on:keydown={handleKeyDown}
  >
    <div class="w-full max-w-md rounded-xl bg-neutral-900 p-6 shadow-xl">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Deposit funds</h2>
        <button
          type="button"
          class="text-sm text-neutral-400 hover:text-neutral-200 disabled:opacity-60"
          on:click={() => dispatch("close")}
          disabled={submitting}
        >
          Close
        </button>
      </div>

      <p class="mb-4 text-sm text-neutral-400">
        Enter the amount you want to deposit into your SokoMjinga wallet. We’ll
        simulate a Safaricom STK push and confirmation.
      </p>

      <!-- form posts to the 'deposit' action on the current route -->
      <form
        method="POST"
        action="?/deposit"
        class="space-y-4"
        on:submit={handleSubmit}
      >
        <div>
          <Label for="amount" class="text-neutral-200">Amount (KES)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="1"
            min="1"
            required
            class="mt-1 bg-neutral-800 text-neutral-100"
            value={amount ?? ""}
          />
        </div>

        {#if error}
          <p class="text-sm text-red-400">{error}</p>
        {/if}

        <div class="mt-4 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-60"
            on:click={() => dispatch("close")}
            disabled={submitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {#if submitting}
              <span
                class="mr-2 inline-flex h-4 w-4 items-center justify-center"
              >
                <span
                  class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                ></span>
              </span>
              Processing…
            {:else}
              Deposit
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
