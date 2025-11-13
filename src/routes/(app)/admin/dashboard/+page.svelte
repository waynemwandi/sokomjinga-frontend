<!-- src/routes/(app)/admin/dashboard/+page.svelte -->
<script lang="ts">
  export let data: {
    stats: {
      total_users: number;
      signups_last_7d: number;
      logins_today: number;
      logins_last_7d: number;
      logins_by_provider: Record<string, number>;
    } | null;
  };

  const s = data.stats;

  // graceful fallback if stats are unavailable
  const cards = s
    ? [
        {
          title: "Total Users",
          value: s.total_users.toLocaleString(),
          delta: "", // you can compute a real delta later
        },
        {
          title: "Signups (last 7 days)",
          value: s.signups_last_7d.toLocaleString(),
          delta: "",
        },
        {
          title: "Logins Today",
          value: s.logins_today.toLocaleString(),
          delta: "",
        },
        {
          title: "Logins (last 7 days)",
          value: s.logins_last_7d.toLocaleString(),
          delta: "",
        },
      ]
    : [
        { title: "Total Users", value: "—", delta: "" },
        { title: "Signups (last 7 days)", value: "—", delta: "" },
        { title: "Logins Today", value: "—", delta: "" },
        { title: "Logins (last 7 days)", value: "—", delta: "" },
      ];
</script>

<h1 class="text-xl font-semibold mb-4">Dashboard</h1>

<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
  {#each cards as c}
    <div
      class="rounded-xl border border-border bg-card/80 shadow-sm hover:border-primary/40 transition-colors p-4"
    >
      <div class="text-xs text-neutral">{c.title}</div>
      <div class="mt-2 flex items-baseline gap-2">
        <div class="text-2xl font-semibold">{c.value}</div>
        {#if c.delta}
          <div class="text-xs text-neutral">{c.delta}</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<div class="mt-6 rounded-xl border border-neutral bg-neutral p-4">
  <div class="text-sm font-medium mb-3">Total Visitors</div>
  <div class="h-48 rounded bg-stone"></div>
</div>

<div class="mt-6 rounded-xl border border-neutral bg-neutral">
  <div class="p-3 border-b border-neutral text-sm flex items-center gap-2">
    <button class="rounded bg-neutral px-2 py-1 text-xs">Outline</button>
    <button class="rounded px-2 py-1 text-xs hover:bg-neutral"
      >Past Performance</button
    >
    <button class="rounded px-2 py-1 text-xs hover:bg-neutral"
      >Key Personnel</button
    >
  </div>
  <div class="p-4 text-sm text-neutral">
    Table placeholder DataTable. (Later: show logins_by_provider, etc.)
  </div>
</div>
