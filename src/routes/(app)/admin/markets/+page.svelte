<script lang="ts">
  import { onMount } from "svelte";
  import { PUBLIC_API_BASE } from "$env/static/public"; // optional; falls back if not set

  type Outcome = {
    id: number;
    label: string; // e.g. "Yes" / "No"
    probability?: number; // optional
  };

  type Market = {
    id: number;
    title: string;
    status?: "open" | "closed" | "settled";
    created_at?: string;
    updated_at?: string;
    // add any UI fields you added in DB (safe to ignore if not present)
    outcomes?: Outcome[];
    // any other fields from your API are fine; extra fields are ignored by TS
    [key: string]: unknown;
  };

  let showCreate = false;
  let newTitle = "";
  let newDescription = "";
  let markets: Market[] = [];
  let loading = true;
  let error: string | null = null;

  // basic UI state
  let q = ""; // quick filter
  let onlyOpen = false;

  // Derive the endpoint. Prefer PUBLIC_API_BASE if present, else try relative.
  const base = PUBLIC_API_BASE?.replace(/\/+$/, "") || "";
  // Prefer /api/markets, but if your API is mounted at /markets, adjust the second option.
  const endpointCandidates = [`${base}/markets`];

  async function fetchMarkets() {
    loading = true;
    error = null;

    for (const url of endpointCandidates) {
      try {
        const res = await fetch(url, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        // Expect array; if your API nests under {data: [...]}, adapt here.
        markets = Array.isArray(data) ? data : (data?.data ?? []);
        loading = false;
        return;
      } catch (e) {
        // try next candidate
      }
    }

    loading = false;
    error = "Failed to load markets from /markets. Check API base or CORS.";
  }

  onMount(fetchMarkets);

  // —— Actions (static stubs for now) ——
  function onEdit(m: Market) {
    // TODO: navigate to /admin/markets/{id}/edit or open a modal
    console.log("edit", m.id);
    alert(`Edit market #${m.id} (TODO)`);
  }

  async function onClose(m: Market) {
    // TODO: call PATCH /markets/:id { status: 'closed' } then refresh
    const ok = confirm(
      `Close market “${m.title}”? This will prevent further trading.`
    );
    if (!ok) return;
    console.log("close", m.id);
    alert(`Close market #${m.id} (TODO API call)`);
    // await fetch(`${base}/api/markets/${m.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'closed' }) })
    // await fetchMarkets();
  }

  async function onDelete(m: Market) {
    // TODO: call DELETE /markets/:id then refresh
    const ok = confirm(
      `Delete market “${m.title}”? This action cannot be undone.`
    );
    if (!ok) return;
    console.log("delete", m.id);
    alert(`Delete market #${m.id} (TODO API call)`);
    // await fetch(`${base}/api/markets/${m.id}`, { method: 'DELETE' })
    // await fetchMarkets();
  }

  // —— Filtering (client-side) ——
  $: filtered = markets
    .filter((m) => (onlyOpen ? (m.status ?? "open") === "open" : true))
    .filter((m) =>
      q ? m.title?.toLowerCase().includes(q.toLowerCase()) : true
    );

  // —— Create Market ——
  async function createMarket() {
    if (!newTitle.trim()) {
      alert("Title is required");
      return;
    }
    const body = {
      title: newTitle.trim(),
      description: newDescription.trim() || null,
      status: "open",
    };

    let created = false;
    for (const baseUrl of endpointCandidates) {
      try {
        const res = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        created = true;
        break;
      } catch {}
    }
    if (!created) {
      alert("Failed to create market. Check API route and CORS.");
      return;
    }

    showCreate = false;
    newTitle = "";
    newDescription = "";
    await fetchMarkets();
  }
</script>

<!-- Header row -->
<div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
  <h1 class="text-xl font-semibold mb-4">Markets</h1>

  <div class="ml-0 md:ml-auto flex w-full md:w-auto items-center gap-2">
    <input
      bind:value={q}
      placeholder="Search markets…"
      class="w-full md:w-75 rounded-md bg-input px-3 py-1.5 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Search markets"
    />
    <label class="inline-flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        bind:checked={onlyOpen}
        class="rounded border-border bg-input"
      />
      Only open
    </label>
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

{#if showCreate}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4"
    role="presentation"
    on:click={() => (showCreate = false)}
    on:keydown={(e) => e.key === "Escape" && (showCreate = false)}
    tabindex="0"
  >
    <div class="absolute inset-0 bg-foreground/50"></div>
    <div
      class="relative w-full max-w-lg rounded-xl border border-border bg-card p-4 shadow-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Create Market"
      on:click|stopPropagation
      tabindex="0"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-base font-semibold">Create Market</h2>
        <button
          class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card"
          on:click={() => (showCreate = false)}
        >
          Close
        </button>
      </div>

      <div class="space-y-3">
        <label class="block text-sm">
          <span class="mb-1 block text-muted-foreground">Title</span>
          <input
            bind:value={newTitle}
            class="w-full rounded-md bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="e.g. Will Kenya qualify for AFCON 2025?"
          />
        </label>

        <label class="block text-sm">
          <span class="mb-1 block text-muted-foreground">Description</span>
          <textarea
            bind:value={newDescription}
            rows="4"
            class="w-full rounded-md bg-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Optional context, resolution criteria, timeline…"
          ></textarea>
        </label>
      </div>

      <div class="mt-4 flex items-center justify-end gap-2">
        <button
          class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card"
          on:click={() => (showCreate = false)}
        >
          Cancel
        </button>
        <button
          class="rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-300 hover:bg-emerald-600/20"
          on:click={createMarket}
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Body states -->
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
          <!-- <th class="px-3 py-2 font-medium">ID</th> -->
          <th class="px-3 py-2 font-medium">Title</th>
          <th class="px-3 py-2 font-medium">Status</th>
          <th class="px-3 py-2 font-medium">Outcomes</th>
          <th class="px-3 py-2 font-medium">Created</th>
          <th class="px-3 py-2 font-medium">Updated</th>
          <th class="px-3 py-2 font-medium text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filtered as m (m.id)}
          <tr class="border-t border-border">
            <!-- <td class="px-3 py-2 align-top">{m.id}</td> -->
            <td class="px-3 py-2 align-top">
              <div class="font-medium">{m.title}</div>
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
                      {o.label}{o.probability != null
                        ? ` · ${Math.round(o.probability * 100)}%`
                        : ""}
                    </span>
                  {/each}
                </div>
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>
            <td class="px-3 py-2 align-top">
              <time class="text-xs text-muted-foreground"
                >{m.created_at
                  ? new Date(m.created_at as string).toLocaleString()
                  : "—"}</time
              >
            </td>
            <td class="px-3 py-2 align-top">
              <time class="text-xs text-muted-foreground"
                >{m.updated_at
                  ? new Date(m.updated_at as string).toLocaleString()
                  : "—"}</time
              >
            </td>
            <td class="px-3 py-2 align-top">
              <div class="flex justify-end gap-2">
                <button
                  class="rounded-md border border-border bg-input px-2 py-1 text-xs hover:bg-card transition"
                  on:click={() => onEdit(m)}
                >
                  Edit
                </button>
                <button
                  class="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition"
                  on:click={() => onClose(m)}
                  disabled={(m.status ?? "open") !== "open"}
                  title={(m.status ?? "open") !== "open"
                    ? "Only open markets can be closed"
                    : "Close market"}
                >
                  Close
                </button>
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
