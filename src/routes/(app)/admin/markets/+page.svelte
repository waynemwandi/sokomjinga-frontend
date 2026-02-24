<!-- src/routes/(app)/admin/markets/+page.svelte -->
<script lang="ts">
  import { Markets } from "$lib/api"; // client helper
  import { CircleAlert } from "lucide-svelte";
  export let data: {
    accessToken?: string | null;
    markets: any[];
  };

  const accessToken = (data.accessToken ?? undefined) as string | undefined;

  type Outcome = { id: string; label: string; price_cents?: number };
  type Market = {
    id: string;
    title: string;
    image_url?: string | null;
    category?: string | null;
    description?: string | null;
    status?: "open" | "closed" | "settled";
    close_at?: string | null;
    projected_end_date?: string | null;
    created_at?: string;
    updated_at?: string;
    outcomes?: Outcome[];
    [key: string]: unknown;
  };

  let showCreate = false;
  let newTitle = "";
  let newDescription = "";
  let newImageUrl = "";
  let newCategory = "";
  let markets: Market[] = data.markets as Market[];
  let loading = false;
  let error: string | null = null;
  let newProjectedEndDate = "";
  let editProjectedEndDate = "";

  // Settlement modal state
  let settleOpen = false;
  let settleMarket: Market | null = null;
  let selectedOutcomeId: string | null = null;

  let q = "";
  let onlyOpen = false;

  async function fetchMarkets() {
    loading = true;
    error = null;
    try {
      markets = await Markets.list();
    } catch (e: any) {
      error = e?.message || "Failed to load markets";
    } finally {
      loading = false;
    }
  }

  async function onClose(m: Market) {
    const ok = confirm(
      `Close market “${m.title}”? This will prevent further trading.`,
    );
    if (!ok) return;
    try {
      await Markets.close(m.id, accessToken);
      await fetchMarkets();
    } catch (e: any) {
      alert(e?.message || "Close failed");
    }
  }

  async function onDelete(m: Market) {
    const ok = confirm(
      `Delete market “${m.title}”? This action cannot be undone.`,
    );
    if (!ok) return;
    try {
      await Markets.del(m.id, accessToken);
      await fetchMarkets();
    } catch (e: any) {
      alert(e?.message || "Delete failed");
    }
  }

  async function createMarket() {
    if (!newTitle.trim()) {
      alert("Title is required");
      return;
    }
    try {
      await Markets.create(
        {
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          image_url: newImageUrl.trim() || null,
          category: newCategory.trim() || null,
          projected_end_date: newProjectedEndDate || null,
          status: "open",
        },
        accessToken,
      );
      showCreate = false;
      newTitle = "";
      newDescription = "";
      newImageUrl = "";
      newCategory = "";
      newProjectedEndDate = "";
      await fetchMarkets();
    } catch (e: any) {
      alert(e?.message || "Create failed");
    }
  }

  $: filtered = markets
    .filter((m) => (onlyOpen ? (m.status ?? "open") === "open" : true))
    .filter((m) =>
      q ? m.title?.toLowerCase().includes(q.toLowerCase()) : true,
    );

  let editOpen = false;
  let edit: Market | null = null;
  let editTitle = "";
  let editDescription = "";
  let editImageUrl = "";
  let editCategory = "";

  function onEdit(m: Market) {
    edit = m;
    editTitle = m.title ?? "";
    editDescription = (m.description as string) ?? "";
    editImageUrl = (m.image_url as string) ?? "";
    editCategory = (m.category as string) ?? "";
    editProjectedEndDate = m.projected_end_date
      ? m.projected_end_date.slice(0, 16)
      : "";
    editOpen = true;
  }

  async function updateMarket() {
    if (!edit) return;
    try {
      await Markets.update(
        edit.id,
        {
          title: editTitle.trim(),
          description: editDescription.trim() || null,
          image_url: editImageUrl.trim() || null,
          category: editCategory.trim() || null,
          projected_end_date: editProjectedEndDate || null,
        },
        accessToken,
      );
      editOpen = false;
      edit = null;
      await fetchMarkets();
    } catch (e: any) {
      alert(e?.message || "Update failed");
    }
  }

  function onSettle(m: Market) {
    settleMarket = m;
    const yes = m.outcomes?.find((o) => o.label?.toLowerCase() === "yes");
    selectedOutcomeId = yes?.id ?? m.outcomes?.[0]?.id ?? null;
    settleOpen = true;
  }

  async function confirmSettlement() {
    if (!settleMarket || !selectedOutcomeId) {
      alert("Please select a winning outcome.");
      return;
    }

    const ok = confirm(
      `Are you sure you want to settle “${settleMarket.title}”? This action cannot be undone.`,
    );
    if (!ok) return;

    try {
      await Markets.settle(settleMarket.id, selectedOutcomeId, accessToken);
      settleOpen = false;
      settleMarket = null;
      selectedOutcomeId = null;
      await fetchMarkets();
    } catch (e: any) {
      alert(e?.message || "Settlement failed");
    }
  }
</script>

<!-- ===========================
  Header Row
=========================== -->
<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
  <h1 class="text-xl font-semibold mb-4">Markets</h1>

  <div class="ml-0 md:ml-auto flex w-full md:w-auto items-center gap-2">
    <!-- Search -->
    <input
      bind:value={q}
      placeholder="Search markets…"
      class="w-full md:w-75 rounded-md bg-input px-3 py-1.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Search markets"
    />

    <!-- Only open checkbox -->
    <label class="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        bind:checked={onlyOpen}
        class="rounded border-border bg-input"
      />
      Only open
    </label>

    <!-- Refresh button -->
    <button
      class="rounded-md border border-border bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition"
      on:click={fetchMarkets}
      aria-label="Refresh"
    >
      Refresh
    </button>

    <!-- New Market -->
    <button
      class="rounded-md border border-border bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20 transition"
      on:click={() => (showCreate = true)}
    >
      + New Market
    </button>
  </div>
</div>

<!-- ===========================
  Create Market Modal
=========================== -->
{#if showCreate}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (showCreate = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (showCreate = false)}
    ></button>

    <div
      class="relative w-full max-w-3xl rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Create Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <!-- Modal header -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Create Market</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (showCreate = false)}
        >
          Close
        </button>
      </div>

      <!-- Modal form -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Left: fields -->
        <div class="space-y-3">
          <div class="grid gap-1.5">
            <label for="new-title" class="text-xs text-muted-foreground"
              >Title *</label
            >
            <input
              id="new-title"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newTitle}
              placeholder="e.g. Will BTC close above $100k by year-end?"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="new-category" class="text-xs text-muted-foreground"
              >Category</label
            >
            <input
              id="new-category"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newCategory}
              placeholder="e.g. Politics, Sports, Markets, Tech"
              list="market-categories"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="new-description" class="text-xs text-muted-foreground"
              >Description</label
            >
            <textarea
              id="new-description"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              rows="4"
              bind:value={newDescription}
              placeholder="Optional context shown to traders"
            ></textarea>
          </div>

          <div class="grid gap-1.5">
            <label for="new-image-url" class="text-xs text-muted-foreground"
              >Image URL</label
            >
            <input
              id="new-image-url"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newImageUrl}
              placeholder="https://…"
            />
          </div>

          <div class="grid gap-1.5">
            <label
              for="new-projected-end"
              class="text-xs text-muted-foreground"
            >
              Projected end date
            </label>
            <input
              id="new-projected-end"
              type="date"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={newProjectedEndDate}
            />
          </div>
        </div>

        <!-- Right: preview -->
        <div class="rounded-lg border border-border bg-muted/30 p-3">
          <div class="text-xs mb-2 text-muted-foreground">Preview</div>
          <div class="rounded-lg overflow-hidden border border-border bg-card">
            {#if newImageUrl.trim()}
              <img
                src={newImageUrl}
                alt="Market preview"
                class="h-40 w-full object-cover"
                on:error={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display =
                    "none")}
              />
            {/if}
            <div class="p-3 space-y-1.5">
              <div class="text-sm font-medium">
                {newTitle || "Untitled market"}
              </div>
              {#if newCategory}
                <span
                  class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs bg-primary/10 text-primary"
                >
                  {newCategory}
                </span>
              {/if}
              {#if newDescription}
                <p class="text-xs text-muted-foreground line-clamp-3">
                  {newDescription}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
            on:click={() => (showCreate = false)}
          >
            Cancel
          </button>
          <button
            class="rounded-md border border-border bg-primary/20 px-3 py-1.5 text-sm text-primary hover:bg-primary/30 disabled:opacity-50"
            on:click={createMarket}
            disabled={!newTitle.trim()}
          >
            Create
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- ===========================
  Edit Market Modal
=========================== -->
{#if editOpen && edit}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (editOpen = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (editOpen = false)}
    ></button>

    <div
      class="relative w-full max-w-3xl rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <!-- Modal header -->
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Edit Market</h2>
        <button
          type="button"
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (editOpen = false)}
        >
          Close
        </button>
      </div>

      <!-- Modal form -->
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Left: fields -->
        <div class="space-y-3">
          <div class="grid gap-1.5">
            <label for="edit-title" class="text-xs text-muted-foreground"
              >Title *</label
            >
            <input
              id="edit-title"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editTitle}
            />
          </div>

          <div class="grid gap-1.5">
            <label for="edit-category" class="text-xs text-muted-foreground"
              >Category</label
            >
            <input
              id="edit-category"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editCategory}
              list="market-categories"
              placeholder="e.g. Politics, Sports, Markets, Tech"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="edit-description" class="text-xs text-muted-foreground"
              >Description</label
            >
            <textarea
              id="edit-description"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              rows="4"
              bind:value={editDescription}
            ></textarea>
          </div>

          <div class="grid gap-1.5">
            <label for="edit-image-url" class="text-xs text-muted-foreground"
              >Image URL</label
            >
            <input
              id="edit-image-url"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editImageUrl}
              placeholder="https://…"
            />
          </div>

          <div class="grid gap-1.5">
            <label
              for="edit-projected-end"
              class="text-xs text-muted-foreground"
            >
              Projected end date
            </label>
            <input
              id="edit-projected-end"
              type="date"
              class="rounded-md border border-border bg-input px-3 py-2 text-sm"
              bind:value={editProjectedEndDate}
            />
          </div>
        </div>

        <!-- Right: preview -->
        <div class="rounded-lg border border-border bg-muted/30 p-3">
          <div class="text-xs mb-2 text-muted-foreground">Preview</div>
          <div class="rounded-lg overflow-hidden border border-border bg-card">
            {#if editImageUrl.trim()}
              <img
                src={editImageUrl}
                alt="Market preview"
                class="h-40 w-full object-cover"
                on:error={(e) =>
                  ((e.currentTarget as HTMLImageElement).style.display =
                    "none")}
              />
            {/if}
            <div class="p-3 space-y-1.5">
              <div class="text-sm font-medium">
                {editTitle || "Untitled market"}
              </div>
              {#if editCategory}
                <span
                  class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs bg-primary/10 text-primary"
                >
                  {editCategory}
                </span>
              {/if}
              {#if editDescription}
                <p class="text-xs text-muted-foreground line-clamp-3">
                  {editDescription}
                </p>
              {/if}
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
            on:click={() => (editOpen = false)}
          >
            Cancel
          </button>
          <button
            class="rounded-md border border-border bg-primary/20 px-3 py-1.5 text-sm text-primary hover:bg-primary/30 disabled:opacity-50"
            on:click={updateMarket}
            disabled={!editTitle.trim()}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

{#if settleOpen && settleMarket}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:keydown={(e) => e.key === "Escape" && (settleOpen = false)}
    tabindex="-1"
  >
    <button
      type="button"
      class="absolute inset-0 bg-foreground/50"
      aria-label="Close dialog"
      on:click={() => (settleOpen = false)}
    ></button>

    <div
      class="relative w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Settle Market"
      on:click|stopPropagation
      on:keydown|stopPropagation
      tabindex="-1"
    >
      <h2 class="text-base font-semibold mb-3">Settle Market</h2>

      <div class="mb-4 text-sm text-muted-foreground">
        Select the winning outcome for:
        <div class="font-medium text-foreground mt-1">
          {settleMarket.title}
        </div>
      </div>

      <!-- Dropdown -->
      <div class="mb-4">
        <label
          for="settle-outcome"
          class="text-xs text-muted-foreground mb-1 block"
        >
          Winning outcome
        </label>

        <select
          id="settle-outcome"
          bind:value={selectedOutcomeId}
          class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm"
        >
          {#each settleMarket.outcomes ?? [] as o}
            <option value={o.id}>
              {o.label}
              {o.price_cents != null ? ` · ${o.price_cents}%` : ""}
            </option>
          {/each}
        </select>
      </div>

      <!-- Warning -->
      <div class="flex items-start gap-2 text-amber-400 text-sm">
        <CircleAlert class="w-4 h-4 mt-0.5" />
        <span
          >Settlement is irreversible. All payouts will be executed immediately.</span
        >
      </div>

      <!-- Buttons -->
      <div class="flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
          on:click={() => (settleOpen = false)}
        >
          Cancel
        </button>

        <button
          type="button"
          class="rounded-md border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-500/20"
          on:click={confirmSettlement}
          disabled={!selectedOutcomeId}
        >
          Confirm Settlement
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- ===========================
  Body States / Market Table
=========================== -->
{#if loading}
  <div class="text-sm text-muted-foreground">Loading markets…</div>
{:else if error}
  <div class="text-sm text-red-500">{error}</div>
{:else if filtered.length === 0}
  <div class="text-sm text-muted-foreground">No markets found.</div>
{:else}
  <div class="overflow-x-auto rounded-lg border border-border">
    <table class="min-w-full text-sm">
      <thead class="bg-card/60">
        <tr class="text-left">
          <th class="px-3 py-2 font-medium">Title</th>
          <th class="px-3 py-2 font-medium">Status</th>
          <th class="px-3 py-2 font-medium">Outcomes</th>
          <th class="px-3 py-2 font-medium">Created</th>
          <th class="px-3 py-2 font-medium">Updated</th>
          <th class="px-3 py-2 font-medium">Projected End</th>
          <th class="px-3 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>

      <tbody>
        {#each filtered as m (m.id)}
          <tr class="border-t border-border">
            <td class="px-3 py-2 align-top">
              <div class="font-medium">{m.title}</div>
              {#if m.category}
                <span
                  class="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded"
                  >{m.category}</span
                >
              {/if}
              {#if m.description}
                <div class="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                  {m.description as string}
                </div>
              {/if}
            </td>

            <td class="px-3 py-2 align-top">
              <span
                class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs
                {(m.status ?? 'open') === 'open'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : ''} 
                {(m.status ?? '') === 'closed'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : ''} 
                {(m.status ?? '') === 'settled'
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : ''}"
              >
                {m.status ?? "open"}
              </span>
            </td>

            <td class="px-3 py-2 align-top">
              {#if m.outcomes?.length}
                <div class="flex flex-wrap gap-1">
                  {#each m.outcomes as o}
                    <span
                      class="inline-flex items-center rounded bg-input px-2 py-0.5 text-xs"
                    >
                      {o.label}
                      {o.price_cents != null ? ` (${o.price_cents}%)` : ""}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>

            <td class="px-3 py-2 align-top">
              <time class="text-xs text-muted-foreground">
                {m.created_at
                  ? new Date(m.created_at as string).toLocaleString()
                  : "—"}
              </time>
            </td>

            <td class="px-3 py-2 align-top">
              <time class="text-xs text-muted-foreground">
                {m.updated_at
                  ? new Date(m.updated_at as string).toLocaleString()
                  : "—"}
              </time>
            </td>

            <td class="px-3 py-2 align-top">
              {#if m.projected_end_date}
                <time class="text-xs text-muted-foreground">
                  {new Date(m.projected_end_date).toLocaleDateString()}
                </time>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>

            <td class="px-3 py-2 align-top">
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card transition"
                  on:click={() => onEdit(m)}
                >
                  Edit
                </button>
                {#if (m.status ?? "open") === "open"}
                  <button
                    class="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
                    on:click={() => onClose(m)}
                  >
                    Close
                  </button>
                {:else if m.status === "closed"}
                  <button
                    class="rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-xs text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition"
                    on:click={() => onSettle(m)}
                  >
                    Settle
                  </button>
                {:else}
                  <button
                    class="rounded-md border border-border bg-input px-2 py-1 text-xs opacity-50 cursor-not-allowed"
                    disabled
                  >
                    Settled
                  </button>
                {/if}
                <button
                  class="rounded-md border border-red-500/40 bg-red-500/10 px-2 py-1 text-xs text-red-600 dark:text-red-300 hover:bg-red-500/20 transition"
                  on:click={() => onDelete(m)}
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<!-- ===========================
  Shared Category Options
=========================== -->
<datalist id="market-categories">
  <option value="Politics"></option>
  <option value="Sports"></option>
  <option value="Markets"></option>
  <option value="Tech"></option>
  <option value="World"></option>
  <option value="Culture"></option>
</datalist>
