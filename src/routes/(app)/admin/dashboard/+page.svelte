<script lang="ts">
  let cards = [
    { title: "Total Revenue", value: "KES 1,250.00", delta: "+12.5%" },
    { title: "New Customers", value: "1,234", delta: "-20%" },
    { title: "Active Accounts", value: "45,678", delta: "+12.5%" },
    { title: "Growth Rate", value: "4.5%", delta: "+4.5%" },
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
        <div class="text-xs text-neutral">{c.delta}</div>
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
  <div class="p-4 text-sm text-neutral">Table placeholder DataTable.</div>
</div>
