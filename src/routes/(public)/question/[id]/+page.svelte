<!-- src/routes/(public)/question/[id]/+page.svelte -->
<script lang="ts">
  import AppHeader from "$lib/components/layout/AppHeader.svelte";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import { onDestroy, onMount } from "svelte";
  import { PUBLIC_API_BASE } from "$env/static/public";
  import { portfolio } from "$lib/stores/portfolio";

  let { data } = $props<{
    data: {
      isAuthed: boolean;
      question: any;
      wallet?: { balance_cents: number; currency: string } | null;
      initialMarketId?: string | null;
      initialSide?: "yes" | "no";
      marketBets?: any[];
    };
  }>();

  let question = $state(data.question);
  let selectedMarketId = $state(
    data.initialMarketId ?? data.question.options?.[0]?.market_id ?? "",
  );
  let selectedSide = $state<"yes" | "no">(data.initialSide ?? "yes");
  let amountKES = $state<number | "">("");
  let isSubmitting = $state(false);
  let pollingInterval: ReturnType<typeof setInterval>;

  const selectedOption = $derived(
    (question.options ?? []).find((o: any) => o.market_id === selectedMarketId) ??
      question.options?.[0],
  );

  const isOpen = $derived((question.status ?? "open") === "open");
  const amountCents = $derived(Math.round(Number(amountKES || 0) * 100));

  const formatKES = (cents: number) =>
    `KES ${Math.round((cents ?? 0) / 100).toLocaleString("en-KE")}`;

  const optionVolume = (option: any) =>
    typeof option.volume_cents === "number" ? formatKES(option.volume_cents) : "KES 0";

  const fetchQuestion = async () => {
    try {
      const res = await fetch(`${PUBLIC_API_BASE}/market-questions/${question.id}`, {
        headers: { accept: "application/json" },
      });
      if (!res.ok) return;
      question = await res.json();
    } catch (err) {
      console.error("Question polling failed:", err);
    }
  };

  onMount(() => {
    if (data.wallet?.balance_cents != null) {
      portfolio.set(data.wallet.balance_cents / 100);
    }
    pollingInterval = setInterval(fetchQuestion, 3000);
  });

  onDestroy(() => {
    if (pollingInterval) clearInterval(pollingInterval);
  });
</script>

<svelte:head>
  <title>{question.title} | MaoniMarket</title>
  <meta name="description" content={question.description ?? question.title} />
</svelte:head>

<AppHeader isAuthed={data.isAuthed} />

<main class="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[1fr_340px]">
  <section class="min-w-0">
    <div class="mb-6 flex items-start gap-4">
      <div class="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-input">
        {#if question.image_url}
          <img src={question.image_url} alt="" class="h-full w-full object-cover" />
        {:else}
          <span class="text-lg font-semibold">{question.title?.slice(0, 2)}</span>
        {/if}
      </div>
      <div class="min-w-0">
        <div class="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
          {#if question.category}<span>{question.category}</span>{/if}
          <span>{formatKES(question.volume_cents ?? 0)} Vol.</span>
          <span>{question.status ?? "open"}</span>
        </div>
        <h1 class="text-2xl font-semibold tracking-tight md:text-3xl">
          {question.title}
        </h1>
        {#if question.description}
          <p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {question.description}
          </p>
        {/if}
      </div>
    </div>

    <div class="divide-y divide-border/70 border-y border-border/70">
      {#each question.options ?? [] as option (option.market_id)}
        <button
          type="button"
          class={`grid w-full grid-cols-[1fr_auto] items-center gap-4 px-1 py-4 text-left transition hover:bg-muted/30 md:grid-cols-[1fr_90px_150px_150px] ${
            selectedMarketId === option.market_id ? "bg-muted/20" : ""
          }`}
        onclick={() => {
            selectedMarketId = option.market_id;
            selectedSide = "yes";
          }}
        >
          <div class="min-w-0">
            <div class="font-semibold">{option.label}</div>
            <div class="mt-1 text-xs text-muted-foreground">
              {optionVolume(option)} Vol.
            </div>
          </div>
          <div class="text-right text-2xl font-semibold">
            {option.yes_price_cents ?? 50}%
          </div>
          <span class="hidden rounded-md bg-emerald-500/15 px-3 py-2 text-center text-sm font-semibold text-emerald-500 md:block">
            Buy Yes {option.yes_price_cents ?? 50}%
          </span>
          <span class="hidden rounded-md bg-red-500/15 px-3 py-2 text-center text-sm font-semibold text-red-400 md:block">
            Buy No {option.no_price_cents ?? 50}%
          </span>
        </button>
      {/each}
    </div>
  </section>

  <aside class="lg:sticky lg:top-5 lg:self-start">
    <div class="rounded-lg border border-border bg-card p-4">
      <div class="mb-4 text-sm font-semibold">
        {selectedOption?.label ?? "Select an option"}
      </div>

      <div class="mb-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          class={`rounded-md px-3 py-3 text-sm font-semibold ${
            selectedSide === "yes"
              ? "bg-emerald-500 text-white"
              : "bg-emerald-500/15 text-emerald-500"
          }`}
          onclick={() => (selectedSide = "yes")}
        >
          Yes {selectedOption?.yes_price_cents ?? 50}%
        </button>
        <button
          type="button"
          class={`rounded-md px-3 py-3 text-sm font-semibold ${
            selectedSide === "no"
              ? "bg-red-500 text-white"
              : "bg-red-500/15 text-red-400"
          }`}
          onclick={() => (selectedSide = "no")}
        >
          No {selectedOption?.no_price_cents ?? 50}%
        </button>
      </div>

      <form
        method="POST"
        action="?/buy"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result, update }) => {
            isSubmitting = false;
            if (result.type === "success" && result.data?.wallet_balance_cents != null) {
              portfolio.set(Number(result.data.wallet_balance_cents) / 100);
              amountKES = "";
              await fetchQuestion();
            }
            await update();
          };
        }}
      >
        <input type="hidden" name="market_id" value={selectedMarketId} />
        <input type="hidden" name="side" value={selectedSide} />
        <input type="hidden" name="amount_cents" value={amountCents} />

        <label for="amount" class="mb-2 block text-xs text-muted-foreground">
          Amount
        </label>
        <div class="mb-4 flex items-center rounded-md border border-border bg-input px-3">
          <span class="text-sm text-muted-foreground">KES</span>
          <input
            id="amount"
            type="number"
            min="1"
            step="1"
            bind:value={amountKES}
            class="min-w-0 flex-1 bg-transparent px-2 py-3 text-right text-2xl outline-none"
            placeholder="0"
          />
        </div>

        <div class="mb-4 grid grid-cols-4 gap-2">
          {#each [50, 100, 500, 1000] as quick}
            <button
              type="button"
              class="rounded-md bg-input px-2 py-2 text-xs text-muted-foreground hover:bg-muted"
              onclick={() => (amountKES = Number(amountKES || 0) + quick)}
            >
              +{quick}
            </button>
          {/each}
        </div>

        <button
          type="submit"
          class="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          disabled={!isOpen || !selectedMarketId || amountCents <= 0 || isSubmitting}
        >
          {isSubmitting ? "Trading..." : "Trade"}
        </button>
      </form>

      <button
        type="button"
        class="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
        onclick={() => goto(`/market/${selectedMarketId}`)}
      >
        Open detailed market
      </button>
    </div>
  </aside>
</main>
