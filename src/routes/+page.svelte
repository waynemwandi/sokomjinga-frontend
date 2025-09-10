<script lang="ts">
  import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';

  // TODO: swap this for real data from +page.server.ts later
  let isAuthed = false; // flip to true to see the small header delta
  const categories = ["Trending","Breaking News","New","Politics","Sports","Kenya","Tanzania"];
  const tags = ["All","Ruto Presidency","Kenya vs Morocco","CHAN","Nairobi Governor","Juba", "Sudan"];
  const markets = [
    {
      id: 'm1',
      title: 'Will Ruto serve WANTAM?',
      volume: 'KES 274,692 Vol.',
      outcomes: [
        { label: 'Yes', pct: 6 },
        { label: 'No', pct: 94 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=WA'
    },
    {
      id: 'm2',
      title: 'Will Kenya win the 2024 AFCON?',
      volume: 'KES 2m Vol.',
      outcomes: [
        { label: 'Yes', pct: 80 },
        { label: 'No', pct: 20 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=AF'
    },
    {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
        {
      id: 'm2',
      title: 'Would you support a coalition government?',
      volume: 'KES 947,856 Vol.',
      outcomes: [
        { label: 'Yes', pct: 63 },
        { label: 'No', pct: 37 },
      ],
      img: 'https://dummyimage.com/48x48/2e3440/ffffff&text=NY'
    },
    // ...add a few more for the grid
  ];
</script>

<!-- Header -->
<header class="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
  <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-[64px] flex items-center gap-3">
    <a href="/" class="inline-flex items-center gap-2">
      <span class="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-7 w-7">
        <GalleryVerticalEndIcon class="h-4 w-4" />
      </span>
      <span class="font-semibold">SokoMjinga</span>
    </a>

    <!-- search -->
    <div class="ml-3 flex-1">
      <div class="relative">
        <input
          class="w-full md:w-[560px] rounded-md border border-border bg-input px-3 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Search markets"
        />
      </div>
    </div>

    <!-- right actions -->
    {#if isAuthed}
      <a href="/portfolio" class="hidden md:inline-flex text-sm text-muted-foreground hover:text-foreground">Portfolio $0.00</a>
      <a href="/deposit" class="ml-3 hidden md:inline-flex rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Deposit</a>
      <a href="/account" class="ml-4 text-sm text-muted-foreground hover:text-foreground">My Account</a>
    {:else}
      <a href="/login" class="ml-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground">Log In</a>
      <a href="/signup" class="ml-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:opacity-90">Sign Up</a>
    {/if}
  </div>

  <!-- primary nav row -->
  <div class="border-t border-border/60">
    <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-4 overflow-x-auto">
      {#each categories as c}
        <button class="shrink-0 rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent">
          {c}
        </button>
      {/each}
    </div>
  </div>

  <!-- secondary tags row -->
  <div class="border-t border-border/60">
    <div class="mx-auto w-full max-w-[1400px] px-4 md:px-6 h-12 flex items-center gap-2 overflow-x-auto">
      {#each tags as t, i}
        <button
          class="shrink-0 rounded-md px-3 py-1.5 text-xs md:text-sm
                 {i === 0 ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'}">
          {t}
        </button>
      {/each}
    </div>
  </div>
</header>

<!-- Grid -->
<main class="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
  <div
    class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
  >
    {#each markets as m}
      <article
        class="group rounded-xl border border-border/70 bg-card/80 shadow-sm
               hover:border-primary/40 transition-colors"
      >
        <!-- card header -->
        <div class="flex items-start gap-3 p-4 border-b border-border/60">
          <img alt="" class="h-10 w-10 rounded bg-muted/50 object-cover" src={m.img} />
          <div class="min-w-0">
            <h3 class="text-sm font-medium leading-snug line-clamp-2">{m.title}</h3>
            <div class="mt-1 text-xs text-muted-foreground">{m.volume}</div>
          </div>
          <div class="ml-auto opacity-60 group-hover:opacity-100 transition">⋯</div>
        </div>

        <!-- outcomes -->
        <div class="p-4 flex flex-col gap-3">
          {#each m.outcomes as o}
            <button
              class="w-full rounded-md border border-border bg-input px-3 py-2 text-sm
                    hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
            >
              <span>{o.label}</span>
              <span class="font-semibold">{o.pct}%</span>
            </button>
          {/each}
        </div>

        <!-- footer -->
        <div class="px-4 py-3 border-t border-border/60 text-xs text-muted-foreground">
          More details ▸
        </div>
      </article>
    {/each}
  </div>
</main>
