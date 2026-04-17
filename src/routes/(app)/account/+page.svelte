<!-- src/routes/(app)/account/+page.svelte -->
<script lang="ts">
  import { Mail, Phone, ArrowUpRight, Settings } from "lucide-svelte";
  import DepositModal from "$lib/components/wallet/DepositModal.svelte";
  import { page } from "$app/stores";
  import { Wallet, getJSON } from "$lib/api";

  // Shape for /me/bets response (flat, not nested market)
  type Bet = {
    bet_id?: string;
    id?: string;
    market_id?: string;
    title?: string;
    category?: string;
    prediction?: "yes" | "no" | string;
    result?: "correct" | "incorrect" | "pending" | string;
    created_at?: string;
    yes_percentage?: number;
    no_percentage?: number;
  };

  export let data: {
    user: any;
    bets?: Bet[];
    positions?: any[];
    profile?: {
      phone_e164?: string | null;
      phone_verified?: boolean;
    };
    wallet?: any;
    statement?: { items: any[]; total: number };
    page?: number;
    pageSize?: number;
    openDeposit?: any;
  };

  const u = data.user ?? {};
  const userProfile = u.profile ?? u.user_profile ?? {};
  const serverProfile = data.profile ?? null;

  let phone: string | null = serverProfile?.phone_e164 ?? null;
  let phoneVerified = serverProfile?.phone_verified ?? false;

  const displayName = u.name ?? userProfile.full_name ?? userProfile.name;

  const email = u.email ?? userProfile.email ?? "";

  let editingPhone = false;
  let phoneInput = "";
  let phoneError: string | null = null;
  let savingPhone = false;

  const handle =
    userProfile.handle ??
    userProfile.username ??
    (email ? `@${email.split("@")[0]}` : "@johnmwangi");

  const bio =
    userProfile.bio ??
    "Avid predictor and market enthusiast. I believe in the power of informed predictions and community intelligence.";

  const memberSince = u.created_at
    ? new Date(u.created_at).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
      })
    : "November 2024";

  const initials =
    (displayName &&
      displayName
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()) ||
    "JM";

  // ----- WALLET / STATEMENT (from portfolio) -----
  let positions = data.positions;
  $: statement = data.statement?.items ?? [];
  $: total = data.statement?.total ?? 0;
  $: currentPage = data.page ?? 0;
  let PAGE_SIZE = data.pageSize ?? 10;

  let depositOpen = Boolean(data.openDeposit);
  let depositError: string | null = null;
  let depositAmount: string | number | null = null;

  $: {
    const params = $page.url.searchParams;

    if (params.has("deposit")) {
      depositOpen = true;
    }

    const amt = params.get("amount");
    if (amt) {
      depositAmount = amt;
    }
  }

  const formatKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(v)}`;

  const formatShortKES = (v: number) =>
    `KES ${new Intl.NumberFormat("en-KE").format(v)}`;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
</script>

<main class="space-y-8">
  <!-- Header section -->
  <section
    class="border-b border-border bg-card/40 -mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 py-8"
  >
    <div class="mx-auto w-full max-w-5xl">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div class="flex items-start gap-4">
          <!-- Avatar -->
          <div
            class="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-2xl font-bold text-white"
          >
            {initials}
          </div>

          <!-- User info -->
          <div>
            <h1 class="text-3xl font-bold text-foreground">
              {displayName}
            </h1>
            <p class="text-muted-foreground mt-1">{handle}</p>
            <p class="text-xs md:text-sm text-muted-foreground mt-2">
              Member since {memberSince}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button
            type="button"
            class="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-xs md:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <ArrowUpRight class="mr-2 h-4 w-4" />
            Share Profile
          </button>

          <button
            type="button"
            class="inline-flex items-center rounded-md border border-border bg-transparent px-3 py-2 text-xs md:text-sm text-foreground hover:bg-accent hover:text-accent-foreground"
            aria-label="Settings"
          >
            <Settings class="h-4 w-4" />
          </button>
        </div>
      </div>

      <!-- Bio -->
      <p class="mt-6 text-sm md:text-base text-muted-foreground max-w-2xl">
        {bio}
      </p>

      <!-- Profile details row (email / phone) -->
      <div class="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div
          class="rounded-lg border border-border bg-card/60 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground"
          >
            <Mail class="h-4 w-4" />
          </div>
          <div class="min-w-0">
            <p
              class="text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Email
            </p>
            <p class="truncate text-foreground">
              {email || "Not set"}
            </p>
          </div>
        </div>

        <div
          class="rounded-lg border border-border bg-card/60 px-4 py-3 flex items-center gap-3"
        >
          <div
            class="h-8 w-8 flex items-center justify-center rounded-md bg-muted text-muted-foreground"
          >
            <Phone class="h-4 w-4" />
          </div>

          <div class="min-w-0 flex-1">
            <p
              class="text-[11px] uppercase tracking-wide text-muted-foreground"
            >
              Phone
            </p>

            {#if editingPhone}
              <form method="POST">
                <div class="mt-1 space-y-2">
                  <input
                    type="text"
                    name="phone"
                    bind:value={phoneInput}
                    placeholder="+2547XXXXXXXX"
                    class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
                    required
                  />

                  <div class="flex gap-2">
                    <button
                      type="submit"
                      class="rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      on:click={() => (editingPhone = false)}
                      class="rounded-md border border-border px-3 py-1.5 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            {:else}
              <div class="flex items-center justify-between">
                <p class="truncate text-foreground">
                  {phone ?? "Not set"}
                </p>

                <button
                  type="button"
                  on:click={() => {
                    phoneInput = phone ?? "";
                    editingPhone = true;
                  }}
                  class="text-xs text-primary hover:underline"
                >
                  {phone ? "Edit" : "Add"}
                </button>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Transaction / prediction history -->
  <section class="-mx-4 md:-mx-6 xl:-mx-8 px-4 md:px-6 xl:px-8 pb-8">
    <div class="mx-auto w-full max-w-5xl">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold">Wallet statement</h2>
        </div>

        {#if !statement || statement.length === 0}
          <p class="text-sm text-muted-foreground">
            No transactions yet. Deposits and settlements will appear here.
          </p>
        {:else}
          <div class="overflow-x-auto rounded-lg border border-border">
            <table class="min-w-full text-sm">
              <thead class="bg-card/60">
                <tr class="text-left">
                  <th class="px-3 py-2 font-medium">Date</th>
                  <th class="px-3 py-2 font-medium">Type</th>
                  <th class="px-3 py-2 font-medium">Reference</th>
                  <th class="px-3 py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {#each statement as item (item.id)}
                  <tr class="border-t border-border hover:bg-muted/40">
                    <td class="px-3 py-2">
                      <span class="text-xs text-muted-foreground">
                        {formatDate(item.created_at)}
                      </span>
                    </td>

                    <td class="px-3 py-2">
                      <span class="text-sm font-medium">
                        {item.kind}
                      </span>
                    </td>

                    <td class="px-3 py-2">
                      {#if item.mpesa_reference}
                        <span class="text-xs text-muted-foreground">
                          MPESA: {item.mpesa_reference}
                        </span>
                      {:else}
                        <span class="text-xs text-muted-foreground"> — </span>
                      {/if}
                    </td>

                    <td class="px-3 py-2 text-right">
                      <span
                        class="font-semibold {item.direction === 'in'
                          ? 'text-emerald-500'
                          : 'text-red-500'}"
                      >
                        {item.direction === "in" ? "+" : "-"}
                        {formatShortKES(
                          Math.abs(item.signed_amount_cents / 100),
                        )}
                      </span>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>

          <!-- PAGINATION STARTS HERE -->
          {#if total > PAGE_SIZE}
            <div class="mt-4 flex items-center justify-between text-sm">
              <a
                href={`?page=${Math.max(0, currentPage - 1)}`}
                data-sveltekit-noscroll
                class="rounded-md border px-3 py-1 {currentPage === 0
                  ? 'opacity-40 pointer-events-none'
                  : ''}"
              >
                Previous
              </a>

              <span class="text-muted-foreground">
                Page {currentPage + 1}
              </span>

              <a
                href={`?page=${currentPage + 1}`}
                data-sveltekit-noscroll
                class="rounded-md border px-3 py-1 {(currentPage + 1) *
                  PAGE_SIZE >=
                total
                  ? 'opacity-40 pointer-events-none'
                  : ''}"
              >
                Next
              </a>
            </div>
          {/if}
          <!-- PAGINATION ENDS HERE -->
        {/if}
      </div>
    </div>
  </section>

  <!-- Deposit modal -->
  <DepositModal open={depositOpen} on:close={() => (depositOpen = false)} />
</main>
