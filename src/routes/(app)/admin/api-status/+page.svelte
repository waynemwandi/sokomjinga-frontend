<!-- src/routes/(app)/admin/api-status/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";

  let status: "checking" | "RUNNING" | "DOWN" = "checking";
  let data: any = null;
  let error: string | null = null;
  let latency: number | null = null;

  import { API_BASE } from "$lib/api";

  const url = `${API_BASE}/health`;

  async function check() {
    status = "checking";
    data = null;
    error = null;
    latency = null;

    const start = performance.now();

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Health endpoint not reachable");

      data = await res.json();
      latency = Math.round(performance.now() - start);
      status = "RUNNING";
    } catch (e) {
      error = String(e);
      status = "DOWN";
    }
  }

  onMount(check);
</script>

<h1 class="text-2xl font-semibold mb-6">API Status</h1>

<div
  class="rounded-2xl border border-border bg-card/80 p-6 space-y-6 shadow-sm"
>
  <!-- STATUS BADGE -->
  <div class="flex items-center justify-between">
    <div class="text-sm text-muted-foreground">
      Health endpoint: <code class="text-foreground">{url}</code>
    </div>

    <div class="flex items-center gap-2">
      {#if status === "RUNNING"}
        <span
          class="px-3 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
        >
          RUNNING
        </span>
      {:else if status === "DOWN"}
        <span
          class="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 border border-red-500/30"
        >
          DOWN
        </span>
      {:else}
        <span
          class="px-3 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
        >
          CHECKING
        </span>
      {/if}
    </div>
  </div>

  <!-- META INFO -->
  {#if status === "RUNNING" && data}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
      <div class="rounded-xl bg-muted/30 p-4 border border-border">
        <div class="text-muted-foreground text-xs mb-1">Service</div>
        <div class="font-medium">{data.service ?? "Unknown"}</div>
      </div>

      <div class="rounded-xl bg-muted/30 p-4 border border-border">
        <div class="text-muted-foreground text-xs mb-1">Response Time</div>
        <div class="font-medium">{latency} ms</div>
      </div>

      <div class="rounded-xl bg-muted/30 p-4 border border-border">
        <div class="text-muted-foreground text-xs mb-1">Timestamp</div>
        <div class="font-medium">{data.time ?? "-"}</div>
      </div>
    </div>
  {/if}

  <!-- JSON OUTPUT -->
  {#if data}
    <div class="rounded-xl bg-black/40 p-4 border border-border">
      <pre class="text-xs overflow-x-auto text-emerald-300">
{JSON.stringify(data, null, 2)}
      </pre>
    </div>
  {:else if error}
    <div class="rounded-xl bg-red-500/10 p-4 border border-red-500/20">
      <pre class="text-xs text-red-400">{error}</pre>
    </div>
  {/if}

  <!-- ACTION -->
  <div class="flex justify-end">
    <button
      class="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition"
      on:click={check}
    >
      Recheck
    </button>
  </div>
</div>
