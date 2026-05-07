<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { X } from "lucide-svelte";
  import GoogleAuthCard from "./GoogleAuthCard.svelte";

  export let googleStartUrl: string;
  export let onClose: () => void = () => {};

  const close = () => onClose();

  onMount(() => {
    document.body.style.overflow = "hidden";
  });

  onDestroy(() => {
    document.body.style.overflow = "";
  });
</script>

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
  role="button"
  tabindex="0"
  onclick={close}
  onkeydown={(e) => {
    if (e.key === "Escape" || e.key === "Enter") close();
  }}
>
  <div
    class="relative w-full max-w-md"
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      class="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/90 text-muted-foreground transition hover:bg-accent hover:text-foreground"
      aria-label="Close"
      onclick={close}
    >
      <X class="h-4 w-4" />
    </button>

    <GoogleAuthCard {googleStartUrl} compact />
  </div>
</div>
