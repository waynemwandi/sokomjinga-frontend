<script lang="ts">
  import { onMount } from 'svelte';
  import { getJSON, API_BASE } from '$lib/api';

  let status: 'checking' | 'RUNNING' | 'DOWN' = 'checking';
  let data: any = null;
  let error: string | null = null;
  const url = `${API_BASE}/health`;

  async function check() {
    status = 'checking';
    data = null;
    error = null;
    try {
      data = await getJSON('/health');   // browser → CORS path
      status = 'RUNNING';
    } catch (e) {
      error = String(e);
      status = 'DOWN';
    }
  }

  onMount(check);
</script>

<h1 class="text-xl font-semibold mb-4">API Status</h1>

<div class="rounded-xl border border-border bg-card/80 p-4 space-y-3">
  <div class="text-sm">Health endpoint: <code>{url}</code></div>
  <div class="text-sm">Status: <strong>{status === 'RUNNING' ? 'UP' : status === 'DOWN' ? 'DOWN' : 'checking...'}</strong></div>

  {#if data}
    <pre class="text-xs overflow-x-auto p-3 rounded bg-neutral">{JSON.stringify(data, null, 2)}</pre>
  {:else if error}
    <pre class="text-xs overflow-x-auto p-3 rounded bg-neutral">{error}</pre>
  {/if}

  <button class="rounded-md border border-border bg-input px-3 py-1.5 text-sm hover:bg-card transition"
          on:click={check}>
    Recheck
  </button>
</div>
