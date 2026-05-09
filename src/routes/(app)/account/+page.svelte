<!-- src/routes/(app)/account/+page.svelte -->
<script lang="ts">
  import { page } from "$app/stores";
  import { invalidateAll } from "$app/navigation";
  import { Mail, MessageSquareText, Phone, UserRound } from "lucide-svelte";
  import DepositModal from "$lib/components/wallet/DepositModal.svelte";

  type StatementItem = {
    id: string;
    created_at: string;
    kind: string;
    signed_amount_cents: number;
    direction: "in" | "out";
    reference_type?: string | null;
    reference_id?: string | null;
    description?: string | null;
    mpesa_reference?: string | null;
    mpesa_phone?: string | null;
  };

  export let data: {
    user: any;
    profile?: {
      phone_e164?: string | null;
      phone_verified?: boolean;
      username?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
    };
    statement?: { items: StatementItem[]; total: number };
    page?: number;
    pageSize?: number;
    openDeposit?: any;
  };

  export let form:
    | {
        success?: boolean;
        field?: "username" | "phone" | "bio";
        message?: string;
      }
    | undefined;

  const u = data.user ?? {};
  const userProfile = u.profile ?? u.user_profile ?? {};
  const serverProfile = data.profile ?? null;

  const displayName = u.name ?? userProfile.full_name ?? userProfile.name ?? "";
  const email = u.email ?? userProfile.email ?? "";
  const savedUsername = serverProfile?.username ?? userProfile.username ?? null;
  const fallbackUsername = email ? email.split("@")[0] : "maonimarket";
  const handle = `@${savedUsername || fallbackUsername}`;
  const avatarUrl = serverProfile?.avatar_url ?? userProfile.avatar_url ?? null;
  const phone = serverProfile?.phone_e164 ?? null;
  const fallbackBio =
    "Avid predictor and market enthusiast. I believe in the power of informed predictions and community intelligence.";
  const savedBio = serverProfile?.bio ?? userProfile.bio ?? null;
  const memberSince = u.created_at
    ? new Date(u.created_at).toLocaleDateString("en-KE", {
        year: "numeric",
        month: "long",
      })
    : "November 2024";

  let usernameInput = savedUsername || fallbackUsername;
  let phoneInput = phone ?? "";
  const usernamePattern = "[a-z0-9_]{3,24}";
  let editingUsername = false;
  let editingPhone = false;
  let editingBio = false;
  let bioInput = savedBio || fallbackBio;

  const initialsSource = displayName || savedUsername || email || "Maoni Market";
  const initials =
    initialsSource
      .split(/[\s._-]+/)
      .filter(Boolean)
      .map((part: string) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "MM";

  $: statement = data.statement?.items ?? [];
  $: total = data.statement?.total ?? 0;
  $: currentPage = data.page ?? 0;
  const PAGE_SIZE = data.pageSize ?? 10;

  let depositOpen = Boolean(data.openDeposit);
  $: {
    const params = $page.url.searchParams;
    if (params.has("deposit")) depositOpen = true;
  }

  const formatShortKES = (cents: number) =>
    `KES ${new Intl.NumberFormat("en-KE").format(Math.abs(cents / 100))}`;

  const formatDate = (iso: string) =>
    Number.isNaN(new Date(iso).getTime())
      ? "Date unavailable"
      : new Date(iso).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
        });

  const activityLabel = (kind: string) => {
    const labels: Record<string, string> = {
      deposit: "Deposit",
      bet_lock: "Prediction placed",
      settlement_payout: "Market payout",
      settlement_fee: "Platform fee",
      withdrawal: "Withdrawal",
      withdrawal_request: "Withdrawal request",
      withdrawal_completed: "Withdrawal sent",
      withdrawal_rejected: "Withdrawal returned",
    };

    return (
      labels[kind] ??
      kind
        .split("_")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  };

  const activityDetail = (item: StatementItem) => {
    if (item.kind === "deposit" && item.mpesa_reference) {
      return `M-Pesa ref ${item.mpesa_reference}`;
    }
    if (item.description) return item.description;
    if (item.kind === "deposit") return "Cash added to your wallet";
    if (item.kind === "bet_lock") return "Prediction amount placed";
    if (item.kind === "settlement_payout") return "Winnings paid into your wallet";
    if (item.kind === "withdrawal") return "Cash sent to your M-Pesa number";
    if (item.kind === "withdrawal_request") return "Withdrawal request received";
    if (item.kind === "withdrawal_rejected") return "Funds returned to your wallet";
    if (item.reference_type === "wallet_bet") return "Market prediction";
    if (item.reference_type === "wallet_deposit") return "Cash deposit";
    if (item.reference_type === "wallet_withdrawal") return "Cash withdrawal";
    return "Wallet activity";
  };
</script>

<main class="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">
  <section class="mb-5 border-b border-dashed border-border/70 pb-5">
    <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      Account
    </p>
    <h1 class="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
      Profile
    </h1>
    <p class="mt-2 max-w-2xl text-sm text-muted-foreground">
      Manage your public username, M-Pesa phone number, and wallet activity.
    </p>
  </section>

  <section class="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)]">
    <article
      class="rounded-xl border border-border bg-card p-6 text-center shadow-sm"
    >
      <div
        class="mx-auto h-36 w-36 overflow-hidden rounded-full border-[10px] border-muted bg-emerald-600 text-white shadow-sm md:h-44 md:w-44"
      >
        {#if avatarUrl}
          <img
            src={avatarUrl}
            alt={`${displayName || "Account"} avatar`}
            class="h-full w-full object-cover"
            referrerpolicy="no-referrer"
          />
        {:else}
          <div
            class="flex h-full w-full items-center justify-center text-5xl font-semibold md:text-6xl"
          >
            {initials}
          </div>
        {/if}
      </div>

      <h2 class="mt-5 break-words text-2xl font-semibold">
        {displayName || "MaoniMarket user"}
      </h2>
      <p class="mt-1 text-sm text-muted-foreground">{handle}</p>
      <span
        class="mt-3 inline-flex rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
      >
        Active account
      </span>

      <div class="mt-6 border-t border-border/60 pt-5 text-left">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Member since
        </p>
        <p class="mt-1 text-sm font-medium">{memberSince}</p>
      </div>
    </article>

    <article class="rounded-xl border border-border bg-card shadow-sm">
      <div class="flex items-start justify-between gap-3 border-b border-border/60 p-5">
        <div>
          <h2 class="text-lg font-semibold">Account details</h2>
          <p class="mt-1 text-sm text-muted-foreground">
            Keep your trading identity and payout phone current.
          </p>
        </div>
        <span class="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"></span>
      </div>

      <div class="divide-y divide-border/60 p-5">
        <div class="grid gap-4 py-4 first:pt-0 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start">
          <div class="rounded-md bg-muted p-3 text-muted-foreground">
            <MessageSquareText class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Public profile
            </p>
            <p class="mt-1 max-w-2xl text-sm text-muted-foreground">
              {savedBio || fallbackBio}
            </p>

            {#if editingBio}
              <form method="POST" action="?/bio" class="mt-3 max-w-2xl space-y-3">
                <textarea
                  name="bio"
                  bind:value={bioInput}
                  maxlength="280"
                  rows="4"
                  class="w-full rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                ></textarea>
                <div class="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
                  <span>Keep it short. This will be public later.</span>
                  <span>{bioInput.length}/280</span>
                </div>
                {#if form?.message && form.field === "bio"}
                  <p
                    class={`rounded-md border px-3 py-2 text-xs ${
                      form.success
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                        : "border-red-500/30 bg-red-500/10 text-red-500"
                    }`}
                  >
                    {form.message}
                  </p>
                {/if}
                <div class="grid max-w-md grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-border px-3 py-2.5 text-sm font-medium transition hover:bg-accent"
                    onclick={() => {
                      bioInput = savedBio || fallbackBio;
                      editingBio = false;
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </form>
            {/if}
          </div>
          <button
            type="button"
            class="w-fit rounded-md border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
            onclick={() => {
              bioInput = savedBio || fallbackBio;
              editingBio = true;
            }}
          >
            Edit
          </button>
        </div>

        <div class="grid gap-4 py-4 first:pt-0 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start">
          <div class="rounded-md bg-muted p-3 text-muted-foreground">
            <Mail class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Google email
            </p>
            <p class="mt-1 truncate text-sm font-semibold">{email || "Not set"}</p>
            <p class="mt-2 text-xs text-muted-foreground">
              Managed by Google sign-in.
            </p>
          </div>
        </div>

        <div class="grid gap-4 py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start">
          <div class="rounded-md bg-muted p-3 text-muted-foreground">
            <UserRound class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Username
            </p>
            <p class="mt-1 truncate text-sm font-semibold">
              @{savedUsername || fallbackUsername}
            </p>

            {#if editingUsername}
              <form method="POST" action="?/username" class="mt-3 space-y-3">
                <label class="block">
                  <span class="sr-only">Username</span>
                  <div
                    class="flex max-w-md items-center rounded-md border border-border bg-input focus-within:ring-2 focus-within:ring-ring"
                  >
                    <span class="pl-3 text-sm text-muted-foreground">@</span>
                    <input
                      name="username"
                      bind:value={usernameInput}
                      class="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-sm outline-none"
                      pattern={usernamePattern}
                      maxlength="24"
                      autocomplete="username"
                      required
                    />
                  </div>
                  <span class="mt-1 block text-[11px] text-muted-foreground">
                    3-24 lowercase letters, numbers, or underscore.
                  </span>
                </label>

                {#if form?.message && form.field === "username"}
                  <p
                    class={`max-w-md rounded-md border px-3 py-2 text-xs ${
                      form.success
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {form.message}
                  </p>
                {/if}

                <div class="grid max-w-md grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-border px-3 py-2.5 text-sm font-medium transition hover:bg-accent"
                    onclick={() => (editingUsername = false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </form>
            {/if}
          </div>
          <button
            type="button"
            class="w-fit rounded-md border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
            onclick={() => {
              usernameInput = savedUsername || fallbackUsername;
              editingUsername = true;
            }}
          >
            Edit
          </button>
        </div>

        <div class="grid gap-4 py-4 sm:grid-cols-[44px_minmax(0,1fr)_auto] sm:items-start">
          <div class="rounded-md bg-muted p-3 text-muted-foreground">
            <Phone class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              M-Pesa phone
            </p>
            <p class="mt-1 truncate text-sm font-semibold">{phone || "Not set"}</p>

            {#if editingPhone}
              <form method="POST" action="?/phone" class="mt-3 space-y-3">
                <label class="block">
                  <span class="sr-only">Phone</span>
                  <input
                    name="phone"
                    bind:value={phoneInput}
                    placeholder="+2547XXXXXXXX"
                    class="w-full max-w-md rounded-md border border-border bg-input px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </label>

                {#if form?.message && form.field === "phone"}
                  <p
                    class={`max-w-md rounded-md border px-3 py-2 text-xs ${
                      form.success
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {form.message}
                  </p>
                {/if}

                <div class="grid max-w-md grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="rounded-md border border-border px-3 py-2.5 text-sm font-medium transition hover:bg-accent"
                    onclick={() => (editingPhone = false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    class="rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </form>
            {/if}
          </div>
          <button
            type="button"
            class="w-fit rounded-md border border-border px-3 py-1.5 text-xs transition hover:bg-accent"
            onclick={() => {
              phoneInput = phone ?? "";
              editingPhone = true;
            }}
          >
            {phone ? "Edit" : "Add"}
          </button>
        </div>

      </div>
    </article>
  </section>

  <section class="mt-5 rounded-xl border border-border bg-card shadow-sm">
    <div class="border-b border-border/60 p-5">
      <h2 class="text-lg font-semibold">Wallet statement</h2>
      <p class="mt-1 text-sm text-muted-foreground">
        Deposits, predictions, payouts, and withdrawals from your wallet.
      </p>
    </div>

    {#if !statement || statement.length === 0}
      <div class="p-5 text-sm text-muted-foreground">
        Your wallet activity will appear here.
      </div>
    {:else}
      <div class="hidden overflow-x-auto md:block">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Activity</th>
              <th>Details</th>
              <th class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {#each statement as item (item.id)}
              <tr>
                <td class="whitespace-nowrap text-muted-foreground">
                  {formatDate(item.created_at)}
                </td>
                <td class="font-medium">{activityLabel(item.kind)}</td>
                <td class="text-muted-foreground">
                  {activityDetail(item)}
                </td>
                <td class="text-right">
                  <span
                    class={`font-semibold ${
                      item.direction === "in"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.direction === "in" ? "+" : "-"}
                    {formatShortKES(item.signed_amount_cents)}
                  </span>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="divide-y divide-border/60 md:hidden">
        {#each statement as item (item.id)}
          <article class="p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium">{activityLabel(item.kind)}</p>
                <p class="mt-1 text-xs text-muted-foreground">
                  {formatDate(item.created_at)}
                </p>
              </div>
              <p
                class={`shrink-0 font-semibold ${
                  item.direction === "in"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {item.direction === "in" ? "+" : "-"}
                {formatShortKES(item.signed_amount_cents)}
              </p>
            </div>
            <p class="mt-3 text-sm text-muted-foreground">
              {activityDetail(item)}
            </p>
          </article>
        {/each}
      </div>

      {#if total > PAGE_SIZE}
        <div class="flex items-center justify-between border-t border-border/60 p-4 text-sm">
          <a
            href={`?page=${Math.max(0, currentPage - 1)}`}
            data-sveltekit-noscroll
            class={`admin-button ${currentPage === 0 ? "pointer-events-none opacity-40" : ""}`}
          >
            Previous
          </a>

          <span class="text-muted-foreground">Page {currentPage + 1}</span>

          <a
            href={`?page=${currentPage + 1}`}
            data-sveltekit-noscroll
            class={`admin-button ${
              (currentPage + 1) * PAGE_SIZE >= total
                ? "pointer-events-none opacity-40"
                : ""
            }`}
          >
            Next
          </a>
        </div>
      {/if}
    {/if}
  </section>

  <DepositModal
    open={depositOpen}
    on:close={() => (depositOpen = false)}
    on:success={() => invalidateAll()}
  />
</main>
