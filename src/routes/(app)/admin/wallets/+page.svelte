<!-- src/routes/(app)/admin/wallets/+page.svelte -->
<script lang="ts">
  export let data: {
    summary: {
      total_wallets: number;
      user_wallets: number;
      system_wallets: number;
      total_available_cents: number;
      total_pending_cents: number;
      currency: string;
    } | null;
    byType: {
      type: string;
      count: number;
      available_cents: number;
      pending_cents: number;
    }[];
  };

  $: s = data?.summary ?? null;
  $: byTypeRows = Array.isArray(data?.byType) ? data.byType : [];

  const formatKES = (cents: number) =>
    `KES ${(cents / 100).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const prettyType = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const byType = (type: string) =>
    byTypeRows.find((row) => row.type === type) ?? {
      type,
      count: 0,
      available_cents: 0,
      pending_cents: 0,
    };

  $: userWallet = byType("user_wallet");
  $: marketEscrow = byType("market_escrow");
  $: mpesaClearing = byType("mpesa_clearing");
  $: platformFee = byType("platform_fee");

  $: totalHeldCents =
    (s?.total_available_cents ?? 0) + (s?.total_pending_cents ?? 0);
  $: customerAvailableCents = userWallet.available_cents;
  $: pendingWithdrawalCents = userWallet.pending_cents;
  $: marketLockedCents =
    marketEscrow.available_cents + marketEscrow.pending_cents;
  $: platformFeeCents = platformFee.available_cents + platformFee.pending_cents;
  $: customerObligationCents =
    customerAvailableCents + pendingWithdrawalCents + marketLockedCents;
  $: knownSystemCents =
    mpesaClearing.available_cents +
    mpesaClearing.pending_cents +
    platformFeeCents;
  $: explainedCents = customerObligationCents + knownSystemCents;
  $: ledgerGapCents = totalHeldCents - explainedCents;
  $: walletEquation = [
    {
      label: "Customers",
      value: customerAvailableCents + pendingWithdrawalCents,
      note: `${userWallet.count} user wallet${userWallet.count === 1 ? "" : "s"}`,
    },
    {
      label: "Market escrow",
      value: marketLockedCents,
      note: "Open positions",
    },
    {
      label: "Platform fees",
      value: platformFeeCents,
      note: "Revenue kept",
    },
    {
      label: "M-Pesa clearing",
      value: mpesaClearing.available_cents + mpesaClearing.pending_cents,
      note: "Cash bridge",
    },
  ];
  const walletKey = [
    {
      name: "Customers",
      technical: "user_wallet",
      meaning: "Cash users can spend, withdraw, or already reserved for payout.",
      movement: "Deposits increase it. Bets and withdrawals reduce it.",
    },
    {
      name: "Market escrow",
      technical: "market_escrow",
      meaning: "Money held while markets are still open.",
      movement: "Bets move money here. Settlement releases it.",
    },
    {
      name: "Platform fees",
      technical: "platform_fee",
      meaning: "Revenue kept by MaoniMarket after settlement.",
      movement: "Winning settlements may move a fee here.",
    },
    {
      name: "M-Pesa clearing",
      technical: "mpesa_clearing",
      meaning: "The outside cash rail between MaoniMarket and Safaricom.",
      movement: "Deposits reduce it. Withdrawals increase it.",
    },
  ];

  const moneyFlow = [
    "Deposit: M-Pesa clearing -> customer wallet",
    "Bet: customer wallet -> market escrow",
    "Settlement: market escrow -> customer wallet + platform fees",
    "Withdrawal: customer wallet -> M-Pesa clearing",
  ];

  const toneClass = (tone: string) => {
    if (tone === "green") return "text-emerald-500";
    if (tone === "red") return "text-red-500";
    if (tone === "amber") return "text-amber-500";
    return "text-foreground";
  };
</script>

<div class="space-y-8">
  <div>
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Wallet health</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Every wallet bucket should net back to zero.
      </p>
    </div>
  </div>

  <section class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
    <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Ledger equation</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Customers + market escrow + platform fees + M-Pesa clearing.
        </p>
      </div>

      <div class="rounded-xl border border-border bg-background/40 p-4 text-right">
        <div class="text-xs text-muted-foreground">Result</div>
        <div class={`mt-2 text-3xl font-semibold tracking-tight ${toneClass(totalHeldCents === 0 ? "green" : "red")}`}>
          {totalHeldCents === 0 ? "Balanced" : formatKES(totalHeldCents)}
        </div>
        <div class="mt-1 text-xs text-muted-foreground">
          {totalHeldCents === 0 ? "Wallet buckets net to zero" : "Review wallet totals"}
        </div>
      </div>
    </div>

    {#if byTypeRows.length === 0}
      <div class="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No wallet data available.
      </div>
    {:else}
      <div class="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {#each walletEquation as bucket}
          <div class="rounded-xl border border-border bg-background/30 p-4">
            <div class="text-sm text-muted-foreground">{bucket.label}</div>
            <div class="mt-2 text-xl font-semibold tracking-tight">
              {formatKES(bucket.value)}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">{bucket.note}</div>
          </div>
        {/each}
      </div>
    {/if}
  </section>

  <section class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
    <div class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
      <h2 class="text-lg font-semibold tracking-tight">Wallet key</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        What each bucket means when the equation is positive or negative.
      </p>

      <div class="mt-5 grid gap-3 md:grid-cols-2">
        {#each walletKey as item}
          <div class="rounded-xl border border-border bg-background/30 p-4">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold">{item.name}</h3>
              <span class="rounded-md border border-border bg-input px-2 py-0.5 text-[11px] text-muted-foreground">
                {item.technical}
              </span>
            </div>
            <p class="mt-3 text-sm text-muted-foreground">{item.meaning}</p>
            <p class="mt-2 text-xs text-muted-foreground">{item.movement}</p>
          </div>
        {/each}
      </div>
    </div>

    <div class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
      <h2 class="text-lg font-semibold tracking-tight">Money movement</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        The normal paths money should follow.
      </p>

      <div class="mt-5 space-y-3">
        {#each moneyFlow as item, index}
          <div class="flex gap-3 rounded-xl border border-border bg-background/30 p-4">
            <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {index + 1}
            </div>
            <div class="text-sm text-muted-foreground">{item}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>
</div>
