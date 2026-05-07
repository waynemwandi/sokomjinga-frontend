<script lang="ts">
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { ChevronDown } from "lucide-svelte";

  export let isAuthed = false;
  export let onClose: () => void = () => {};

  let step = 1;

  const close = () => onClose();

  onMount(() => {
    document.body.style.overflow = "hidden";
  });

  onDestroy(() => {
    document.body.style.overflow = "";
  });
</script>

<div
  class="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center sm:justify-center"
  role="button"
  tabindex="0"
  onclick={close}
  onkeydown={(e) => {
    if (e.key === "Escape" || e.key === "Enter") {
      close();
    }
  }}
>
  <div
    class="w-full sm:max-w-md overflow-hidden bg-card border border-border shadow-xl rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <div class="relative h-full w-full bg-muted flex items-center justify-center">
      <img
        src={step === 1
          ? "/how-step-1.webp"
          : step === 2
            ? "/how-step-2.webp"
            : "/how-step-3.webp"}
        alt="Step illustration"
        loading="lazy"
        class="h-full w-full object-contain"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-transparent to-card"></div>
    </div>

    <div class="p-6">
      <div class="flex items-start justify-between">
        <h2 class="text-2xl font-bold">
          {#if step === 1}
            <span class="text-primary">1.</span> Pick a Market
          {:else if step === 2}
            <span class="text-primary">2.</span> Place a Trade
          {:else}
            <span class="text-primary">3.</span> Redeem
          {/if}
        </h2>

        <button
          class="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent transition"
          onclick={close}
          aria-label="Dismiss"
        >
          <ChevronDown class="h-5 w-5" />
        </button>
      </div>

      <div class="mt-4 text-sm text-muted-foreground space-y-3 leading-relaxed">
        {#if step === 1}
          <p>Choose a Yes or No market based on your view of the outcome.</p>
          <p>Prices move in real time as other traders buy and sell.</p>
        {:else if step === 2}
          <p>Select the number of shares you want to buy.</p>
          <p>
            Your potential payout depends on the price at the time of purchase.
          </p>
        {:else}
          <p>When the market resolves, each winning share pays out.</p>
          <p>You can track performance in your portfolio at any time.</p>
        {/if}
      </div>

      <div class="mt-6 flex justify-end">
        {#if step < 3}
          <button
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onclick={() => step++}
          >
            Next
          </button>
        {:else}
          <button
            class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
            onclick={() => {
              close();
              if (!isAuthed) goto("/login");
            }}
          >
            {isAuthed ? "Done" : "Get Started"}
          </button>
        {/if}
      </div>

      {#if step === 3}
        <div class="mt-6 text-xs text-muted-foreground text-center">
          Trading is subject to eligibility requirements and our
          <a href="/terms" class="underline hover:text-foreground">
            Terms and Conditions
          </a>.
        </div>
      {/if}
    </div>
  </div>
</div>
