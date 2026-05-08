<!-- src/routes/(app)/admin/api-status/+page.svelte -->
<script lang="ts">
  import { onMount } from "svelte";
  import { API_BASE } from "$lib/api";

  let status: "checking" | "RUNNING" | "DOWN" = "checking";
  let data: any = null;
  let error: string | null = null;
  let latency: number | null = null;

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

<div class="space-y-6">
  <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">API Status</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Check whether the backend health endpoint is reachable.
      </p>
    </div>

    <button class="admin-button-primary w-full sm:w-auto" on:click={check}>
      {status === "checking" ? "Checking..." : "Recheck"}
    </button>
  </div>

  <section class="admin-panel">
    <div class="admin-panel-header">
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Health check</h2>
        <p class="mt-1 break-all text-sm text-muted-foreground">
          Endpoint: <code class="text-foreground">{url}</code>
        </p>
      </div>

      {#if status === "RUNNING"}
        <span
          class="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"
        >
          RUNNING
        </span>
      {:else if status === "DOWN"}
        <span
          class="inline-flex rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400"
        >
          DOWN
        </span>
      {:else}
        <span
          class="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
        >
          CHECKING
        </span>
      {/if}
    </div>

    <div class="space-y-5 p-5">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-border bg-background/40 p-4">
          <div class="text-xs text-muted-foreground">Service</div>
          <div class="mt-2 font-semibold">{data?.service ?? "Unknown"}</div>
        </div>

        <div class="rounded-xl border border-border bg-background/40 p-4">
          <div class="text-xs text-muted-foreground">Response time</div>
          <div class="mt-2 font-semibold">
            {latency == null ? "-" : `${latency} ms`}
          </div>
        </div>

        <div class="rounded-xl border border-border bg-background/40 p-4">
          <div class="text-xs text-muted-foreground">Last checked</div>
          <div class="mt-2 break-all font-semibold">{data?.time ?? "-"}</div>
        </div>
      </div>

      {#if data}
        <div class="rounded-xl border border-border bg-background/50 p-4">
          <div class="mb-3 text-sm font-medium">Raw response</div>
          <pre class="overflow-x-auto text-xs text-emerald-600 dark:text-emerald-300">{JSON.stringify(data, null, 2)}</pre>
        </div>
      {:else if error}
        <div class="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <div class="mb-3 text-sm font-medium text-red-600 dark:text-red-400">
            Request failed
          </div>
          <pre class="overflow-x-auto text-xs text-red-600 dark:text-red-400">{error}</pre>
        </div>
      {:else}
        <div class="rounded-xl border border-border bg-background/50 p-4 text-sm text-muted-foreground">
          Waiting for the health response.
        </div>
      {/if}
    </div>
  </section>
</div>
