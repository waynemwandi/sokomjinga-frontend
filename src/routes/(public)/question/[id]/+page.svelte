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
  let showMobileBuy = $state(false);
  let openOrderBookMarketId = $state<string | null>(null);
  let pollingInterval: ReturnType<typeof setInterval>;

  const selectedOption = $derived(
    (question.options ?? []).find((o: any) => o.market_id === selectedMarketId) ??
      question.options?.[0],
  );

  const isOpen = $derived((question.status ?? "open") === "open");
  const amountCents = $derived(Math.round(Number(amountKES || 0) * 100));
  const selectedPricePercent = $derived(
    selectedSide === "no"
      ? selectedOption?.no_price_cents ?? 50
      : selectedOption?.yes_price_cents ?? 50,
  );
  const selectedSideLabel = $derived(selectedSide === "yes" ? "Yes" : "No");
  const totalKES = $derived(Number(amountKES || 0));
  const potentialPayoutKES = $derived(
    selectedPricePercent > 0 ? (totalKES * 100) / selectedPricePercent : 0,
  );
  const profitKES = $derived(potentialPayoutKES - totalKES);
  const profitToneClass = $derived(
    profitKES > 0
      ? "text-emerald-500 dark:text-emerald-400"
      : profitKES < 0
        ? "text-red-500 dark:text-red-400"
        : "text-muted-foreground",
  );

  const formatKES = (cents: number) =>
    `KES ${Math.round((cents ?? 0) / 100).toLocaleString("en-KE")}`;

  const formatKESValue = (kes: number) =>
    `KES ${Math.round(kes).toLocaleString("en-KE")}`;

  const categories = [
    "All markets",
    "Politics",
    "Crypto",
    "Finance",
    "Culture",
    "Sports",
    "Tech",
    "Other",
  ];

  const optionVolume = (option: any) =>
    typeof option.volume_cents === "number" ? formatKES(option.volume_cents) : "KES 0";

  const initials = $derived((question.title ?? "MK").slice(0, 2).toUpperCase());

  const statusMeta = (status?: string | null) => {
    const value = (status ?? "open").toLowerCase();

    if (value === "open") {
      return {
        label: "Open",
        cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      };
    }

    if (value === "closed") {
      return {
        label: "Closed",
        cls: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      };
    }

    if (value === "settled") {
      return {
        label: "Settled",
        cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      };
    }

    return {
      label: value || "Unknown",
      cls: "bg-muted text-muted-foreground border-border",
    };
  };

  const selectOption = (option: any, side: "yes" | "no" = selectedSide) => {
    selectedMarketId = option.market_id;
    selectedSide = side;
  };

  const toggleOrderBook = (marketId: string) => {
    openOrderBookMarketId =
      openOrderBookMarketId === marketId ? null : marketId;
  };

  const setAmount = (value: number) => {
    amountKES = value;
  };

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

<div class="border-t border-border/60">
  <div
    class="scrollbar-none mx-auto flex h-12 w-full max-w-[1400px] items-center gap-4 overflow-x-auto whitespace-nowrap px-4 md:px-6"
  >
    {#each categories as c}
      <button
        class="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
        onclick={() => goto(`/?category=${encodeURIComponent(c)}`)}
      >
        {c}
      </button>
    {/each}
  </div>
</div>

<main class="mx-auto w-full max-w-[1400px] px-4 py-6 pb-28 md:px-6 md:pb-8">
  <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
    <section class="min-w-0 space-y-5">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div
          class="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md bg-input text-xl font-semibold sm:h-20 sm:w-20"
        >
          {#if question.image_url}
            <img src={question.image_url} alt="" class="h-full w-full object-cover" />
          {:else}
            <span>{initials}</span>
          {/if}
        </div>
        <div class="min-w-0">
          <h1 class="text-3xl font-semibold tracking-tight md:text-4xl">
            {question.title}
          </h1>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <span
              class={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${statusMeta(question.status).cls}`}
            >
              {statusMeta(question.status).label}
            </span>
            {#if question.category}
              <span
                class="inline-flex items-center rounded-md border border-border bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {question.category}
              </span>
            {/if}
          </div>
          <div class="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{formatKES(question.volume_cents ?? 0)} Vol.</span>
            <span class="text-border">|</span>
            <span>{(question.options ?? []).length} markets</span>
          </div>
          {#if question.description}
            <p class="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {question.description}
            </p>
          {/if}
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card">
        {#each question.options ?? [] as option (option.market_id)}
          <article class="border-b border-border/60 last:border-b-0">
            <div class="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_90px_160px_160px] md:items-center">
              <button
                type="button"
                class="min-w-0 text-left"
                onclick={() => {
                  selectOption(option);
                  toggleOrderBook(option.market_id);
                }}
              >
                <div class="text-lg font-semibold">{option.label}</div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {optionVolume(option)} Vol.
                </div>
              </button>

              <button
                type="button"
                class="text-left md:text-center"
                onclick={() => {
                  selectOption(option);
                  toggleOrderBook(option.market_id);
                }}
              >
                <div class="text-2xl font-semibold">
                  {option.yes_price_cents ?? 50}%
                </div>
                <div class="text-[11px] text-muted-foreground">chance</div>
              </button>

              <button
                type="button"
                class="btn btn-yes font-semibold"
                onclick={() => {
                  selectOption(option, "yes");
                  openOrderBookMarketId = option.market_id;
                  showMobileBuy = true;
                }}
              >
                Buy Yes {option.yes_price_cents ?? 50}%
              </button>

              <button
                type="button"
                class="btn btn-no font-semibold"
                onclick={() => {
                  selectOption(option, "no");
                  openOrderBookMarketId = option.market_id;
                  showMobileBuy = true;
                }}
              >
                Buy No {option.no_price_cents ?? 50}%
              </button>
            </div>

            {#if openOrderBookMarketId === option.market_id}
              <div class="border-t border-border/60 bg-background/30 px-4 py-4">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <h2 class="text-sm font-semibold">Order Book</h2>
                    <p class="mt-1 text-xs text-muted-foreground">
                      {option.label}
                    </p>
                  </div>
                  <span class="rounded-md border border-border bg-card px-2 py-1 text-xs text-muted-foreground">
                    Coming soon
                  </span>
                </div>
                <p class="mt-4 text-sm italic text-muted-foreground">
                  Order book coming soon.
                </p>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    </section>

    <aside class="hidden lg:block lg:sticky lg:top-5 lg:self-start">
      <form
        method="POST"
        action="?/buy"
        class="overflow-hidden rounded-xl border border-border bg-card"
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
        <div class="flex items-center justify-between border-b border-border/60 p-4">
          <div class="font-semibold">Buy</div>
          <div
            class={`text-xs font-semibold ${
              selectedSide === "yes"
                ? "text-emerald-500 dark:text-emerald-400"
                : "text-red-500 dark:text-red-400"
            }`}
          >
            {selectedSideLabel} {selectedPricePercent}%
          </div>
        </div>

        <div class="space-y-4 p-4">
          <div>
            <div class="mb-3 text-sm font-semibold">
              {selectedOption?.label ?? "Select an option"}
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                class={`btn flex flex-col items-center justify-center font-semibold ${
                  selectedSide === "yes" ? "btn-yes" : "bg-card border-border"
                }`}
                onclick={() => (selectedSide = "yes")}
              >
                <span>Yes</span>
                <span class="mt-0.5 text-[11px] opacity-80">
                  {selectedOption?.yes_price_cents ?? 50}%
                </span>
              </button>
              <button
                type="button"
                class={`btn flex flex-col items-center justify-center font-semibold ${
                  selectedSide === "no" ? "btn-no" : "bg-card border-border"
                }`}
                onclick={() => (selectedSide = "no")}
              >
                <span>No</span>
                <span class="mt-0.5 text-[11px] opacity-80">
                  {selectedOption?.no_price_cents ?? 50}%
                </span>
              </button>
            </div>
          </div>

          <input type="hidden" name="market_id" value={selectedMarketId} />
          <input type="hidden" name="side" value={selectedSide} />
          <input type="hidden" name="amount_cents" value={amountCents} />

          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <label for="question-amount">Amount</label>
              <span>KES</span>
            </div>
            <input
              id="question-amount"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              bind:value={amountKES}
              class="w-full rounded-md bg-input px-3 py-3 text-right text-2xl font-semibold outline-none"
              placeholder="0"
              oninput={(e) => {
                const digits = e.currentTarget.value.replace(/\D/g, "");
                amountKES = digits === "" ? "" : Number(digits);
              }}
            />
          </div>

          <div class="grid grid-cols-4 gap-2">
            {#each [50, 100, 500, 1000] as quick}
              <button
                type="button"
                class="rounded-md bg-input px-2 py-2 text-xs transition-all hover:bg-muted active:scale-95"
                onclick={() => setAmount(quick)}
              >
                KES {quick}
              </button>
            {/each}
          </div>

          {#if totalKES > 0}
            <div class="space-y-3 rounded-lg border border-border/70 bg-background/40 p-3">
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="text-[11px] text-muted-foreground">Amount placed</p>
                  <p class="mt-1 font-semibold">{formatKESValue(totalKES)}</p>
                </div>
                <div class="text-right">
                  <p class="text-[11px] text-muted-foreground">Market price</p>
                  <p class="mt-1 font-semibold">
                    {selectedSideLabel} {selectedPricePercent}%
                  </p>
                </div>
              </div>

              <div class="border-t border-border/60 pt-3">
                <div class="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                  <div>
                    <p class="text-xs text-muted-foreground">
                      If {selectedSideLabel} wins
                    </p>
                    <p class="mt-1 text-[11px] text-muted-foreground">
                      Includes your {formatKESValue(totalKES)} placed
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-[11px] text-muted-foreground">Could receive</p>
                    <p class="mt-1 text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
                      {formatKESValue(potentialPayoutKES)}
                    </p>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between gap-3">
                  <span class="text-xs text-muted-foreground">Possible gain</span>
                  <span class={`text-sm font-semibold ${profitToneClass}`}>
                    {profitKES >= 0 ? "+" : "-"}{formatKESValue(Math.abs(profitKES))}
                  </span>
                </div>
              </div>
            </div>
          {/if}

          <button
            type="submit"
            class="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
            disabled={!isOpen || !selectedMarketId || amountCents <= 0 || isSubmitting}
          >
            {#if isSubmitting}<span class="action-spinner"></span>{/if}
            {isSubmitting ? "Placing..." : `Place order - ${formatKESValue(totalKES)}`}
          </button>

          <button
            type="button"
            class="w-full text-center text-xs text-muted-foreground transition hover:text-foreground"
            onclick={() => goto(`/market/${selectedMarketId}`)}
          >
            Open detailed market
          </button>
        </div>
      </form>
    </aside>
  </div>

  {#if selectedOption && isOpen}
    <div
      class="fixed bottom-16 left-0 right-0 z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:hidden"
    >
      <div class="flex gap-2">
        <button
          type="button"
          class={`flex-1 rounded-lg border py-3 text-sm font-semibold shadow-lg transition-all duration-150 active:scale-[0.98] ${
            selectedSide === "yes"
              ? "border-emerald-400/60 bg-emerald-600 text-white shadow-emerald-900/40"
              : "border-emerald-500/30 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-black/20"
          }`}
          onclick={() => {
            selectedSide = "yes";
            showMobileBuy = true;
          }}
        >
          Buy Yes at {selectedOption?.yes_price_cents ?? 50}%
        </button>
        <button
          type="button"
          class={`flex-1 rounded-lg border py-3 text-sm font-semibold shadow-lg transition-all duration-150 active:scale-[0.98] ${
            selectedSide === "no"
              ? "border-red-400/60 bg-red-600 text-white shadow-red-950/50"
              : "border-red-500/30 bg-red-500/15 text-red-600 dark:text-red-300 shadow-black/20"
          }`}
          onclick={() => {
            selectedSide = "no";
            showMobileBuy = true;
          }}
        >
          Buy No at {selectedOption?.no_price_cents ?? 50}%
        </button>
      </div>
    </div>
  {/if}
</main>

{#if showMobileBuy && selectedOption && isOpen}
  <div class="fixed inset-0 z-50 md:hidden">
    <button
      type="button"
      aria-label="Close buy panel"
      class="absolute inset-0 cursor-default bg-black/50"
      onclick={() => (showMobileBuy = false)}
    ></button>

    <div
      class="animate-slide-up absolute bottom-0 left-0 right-0 space-y-4 rounded-t-2xl border-t border-border bg-background p-4"
    >
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm font-semibold">Place your prediction</div>
          <div class="mt-1 text-xs text-muted-foreground">
            Buying {selectedSideLabel} at {selectedPricePercent}%
          </div>
        </div>
        <button
          type="button"
          class="text-xs text-muted-foreground"
          onclick={() => (showMobileBuy = false)}
        >
          Close
        </button>
      </div>

      <div class="line-clamp-2 text-sm font-medium leading-snug">
        {question.title}
      </div>

      <div class="rounded-xl border border-border/70 bg-card p-3">
        <div class="text-[11px] uppercase tracking-wide text-muted-foreground">
          Selected market
        </div>
        <div class="mt-1 flex items-center justify-between gap-3">
          <span class="text-sm font-semibold">{selectedOption.label}</span>
          <span
            class={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              selectedSide === "yes"
                ? "border-emerald-400/50 bg-emerald-600 text-white"
                : "border-red-400/50 bg-red-600 text-white"
            }`}
          >
            {selectedSideLabel}
          </span>
        </div>
      </div>

      <input
        type="text"
        inputmode="numeric"
        placeholder="0"
        class="w-full bg-transparent text-center text-3xl font-semibold outline-none"
        bind:value={amountKES}
        oninput={(e) => {
          const digits = e.currentTarget.value.replace(/\D/g, "");
          amountKES = digits === "" ? "" : Number(digits);
        }}
      />

      {#if totalKES > 0}
        <div class="space-y-3 rounded-lg border border-border/70 bg-card p-3">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p class="text-[11px] text-muted-foreground">Amount placed</p>
              <p class="mt-1 font-semibold">{formatKESValue(totalKES)}</p>
            </div>
            <div class="text-right">
              <p class="text-[11px] text-muted-foreground">Possible gain</p>
              <p class={`mt-1 font-semibold ${profitToneClass}`}>
                {profitKES >= 0 ? "+" : "-"}{formatKESValue(Math.abs(profitKES))}
              </p>
            </div>
          </div>
          <div class="border-t border-border/60 pt-3">
            <div class="flex items-end justify-between gap-4">
              <div>
                <p class="text-xs text-muted-foreground">
                  If {selectedSideLabel} wins
                </p>
                <p class="mt-1 text-[11px] text-muted-foreground">
                  Includes your amount placed
                </p>
              </div>
              <div class="text-right">
                <p class="text-[11px] text-muted-foreground">Could receive</p>
                <p class="mt-1 text-2xl font-semibold text-emerald-500 dark:text-emerald-400">
                  {formatKESValue(potentialPayoutKES)}
                </p>
              </div>
            </div>
          </div>
        </div>
      {/if}

      <div class="flex justify-center gap-2">
        {#each [50, 100, 500, 1000] as amt}
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-xs font-medium transition-all active:scale-95"
            onclick={() => setAmount(amt)}
          >
            KES {amt}
          </button>
        {/each}
      </div>

      <form
        method="POST"
        action="?/buy"
        use:enhance={() => {
          isSubmitting = true;
          return async ({ result, update }) => {
            isSubmitting = false;
            showMobileBuy = false;
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

        <button
          type="submit"
          class="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
          disabled={amountCents <= 0 || isSubmitting}
        >
          {#if isSubmitting}<span class="action-spinner"></span>{/if}
          {isSubmitting
            ? "Placing..."
            : `Place order - ${formatKESValue(totalKES)}`}
        </button>
      </form>
    </div>
  </div>
{/if}
