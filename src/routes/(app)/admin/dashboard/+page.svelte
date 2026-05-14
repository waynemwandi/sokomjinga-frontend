<!-- src/routes/(app)/admin/dashboard/+page.svelte -->
<script lang="ts">
  import { goto } from "$app/navigation";

  export let data: {
    stats: {
      total_users: number;
      signups_last_7d: number;
      logins_today: number;
      logins_last_7d: number;
      logins_by_provider: Record<string, number>;
    } | null;
    authSeries: {
      days: number;
      points: { date: string; logins: number }[];
    } | null;
    users: {
      items: {
        id: string;
        email: string;
        name: string | null;
        is_active: boolean;
        is_admin: boolean;
        auth_provider: string | null;
        created_at: string;
        last_login_at: string | null;
        wallet_accounts: number;
        bets: number;
        deposits: number;
      }[];
      total: number;
      limit: number;
      offset: number;
    } | null;
    userPage: number;
    userPageSize: number;
    userSearch: string;
  };

  $: s = data.stats;
  $: points = data.authSeries?.points ?? [];
  $: users = data.users?.items ?? [];
  $: userPage = data.userPage ?? 0;
  $: userPageSize = data.userPageSize ?? 10;
  $: totalUsers = data.users?.total ?? 0;
  $: userSearch = data.userSearch ?? "";
  $: totalUserPages = Math.max(1, Math.ceil(totalUsers / userPageSize));
  $: maxLogins = Math.max(1, ...points.map((p) => p.logins));
  $: midLogins = Math.ceil(maxLogins / 2);
  $: totalChartLogins = points.reduce((sum, p) => sum + p.logins, 0);
  $: activeDays = points.filter((p) => p.logins > 0).length;
  $: peakPoint =
    points.length > 0
      ? points.reduce((max, p) => (p.logins > max.logins ? p : max), points[0])
      : null;

  let expandedUserId: string | null = null;
  let userQuery = data.userSearch ?? "";
  let lastSyncedSearch = data.userSearch ?? "";
  let searchTimer: number | undefined;
  let hoveredLoginIndex: number | null = null;

  $: if ((data.userSearch ?? "") !== lastSyncedSearch) {
    lastSyncedSearch = data.userSearch ?? "";
    userQuery = lastSyncedSearch;
  }

  $: cards = s
    ? [
        {
          title: "Total users",
          value: s.total_users.toLocaleString(),
          note: `${users.filter((u) => u.is_active).length} shown active`,
        },
        {
          title: "New users",
          value: s.signups_last_7d.toLocaleString(),
          note: "Last 7 days",
        },
        {
          title: "Logins today",
          value: s.logins_today.toLocaleString(),
          note: "Admin and users",
        },
        {
          title: "Weekly logins",
          value: s.logins_last_7d.toLocaleString(),
          note: "Last 7 days",
        },
      ]
    : [
        { title: "Total users", value: "-", note: "" },
        { title: "New users", value: "-", note: "" },
        { title: "Logins today", value: "-", note: "" },
        { title: "Weekly logins", value: "-", note: "" },
      ];

  const formatDate = (value: string | null) => {
    if (!value) return "Never";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Never";

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatShortDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  };

  const barHeight = (logins: number) => `${Math.max(4, (logins / maxLogins) * 100)}%`;

  const userPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (userSearch) params.set("q", userSearch);
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };

  function scheduleUserSearch() {
    if (searchTimer) window.clearTimeout(searchTimer);

    searchTimer = window.setTimeout(() => {
      const params = new URLSearchParams();
      const nextQuery = userQuery.trim();

      if (nextQuery) params.set("q", nextQuery);
      params.set("page", "0");

      const nextUrl = params.toString()
        ? `/admin/dashboard?${params.toString()}`
        : "/admin/dashboard";

      goto(nextUrl, { noScroll: true, keepFocus: true });
    }, 250);
  }
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Monitor account growth, login activity, and user access.
    </p>
  </div>

  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
    {#each cards as c}
      <div class="admin-panel p-5 transition-colors hover:border-primary/40">
        <div class="text-sm text-muted-foreground">{c.title}</div>
        <div class="mt-3 text-3xl font-semibold tracking-tight">{c.value}</div>
        {#if c.note}
          <div class="mt-2 text-xs text-muted-foreground">{c.note}</div>
        {/if}
      </div>
    {/each}
  </div>

  <section class="admin-panel p-5">
    <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Login activity</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Daily successful logins over the last {data.authSeries?.days ?? 0} days.
        </p>
      </div>

      <div class="grid grid-cols-3 gap-2 text-right text-xs">
        <div class="rounded-lg border border-border bg-background/40 px-3 py-2">
          <div class="text-muted-foreground">Total</div>
          <div class="mt-1 text-base font-semibold">{totalChartLogins}</div>
        </div>
        <div class="rounded-lg border border-border bg-background/40 px-3 py-2">
          <div class="text-muted-foreground">Active days</div>
          <div class="mt-1 text-base font-semibold">{activeDays}</div>
        </div>
        <div class="rounded-lg border border-border bg-background/40 px-3 py-2">
          <div class="text-muted-foreground">Peak</div>
          <div class="mt-1 text-base font-semibold">{peakPoint?.logins ?? 0}</div>
        </div>
      </div>
    </div>

    {#if points.length === 0}
      <div class="flex h-44 items-center justify-center text-sm text-muted-foreground">
        No login activity yet.
      </div>
    {:else}
      <div class="rounded-xl border border-border/60 bg-background/30 p-4">
        <div class="grid h-60 grid-cols-[3rem_1fr] gap-3">
          <div class="flex h-44 flex-col justify-between pt-1 text-right text-[10px] text-muted-foreground">
            <span>{maxLogins}</span>
            <span>{midLogins}</span>
            <span>0</span>
          </div>

          <div class="relative">
            <div class="absolute inset-x-0 top-0 border-t border-border/60"></div>
            <div class="absolute inset-x-0 top-1/2 border-t border-border/40"></div>
            <div class="absolute inset-x-0 bottom-[28px] border-t border-border/60"></div>

            <div class="relative flex h-full items-end gap-1">
              {#each points as point, index}
                <div class="relative flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div class="flex h-44 w-full items-end">
                    <button
                      type="button"
                      class="mx-auto w-full max-w-7 rounded-t bg-emerald-500/80 p-0 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40"
                      title={`${formatShortDate(point.date)}: ${point.logins} logins`}
                      style={`height: ${barHeight(point.logins)}`}
                      onmouseenter={() => (hoveredLoginIndex = index)}
                      onmouseleave={() => (hoveredLoginIndex = null)}
                      onfocus={() => (hoveredLoginIndex = index)}
                      onblur={() => (hoveredLoginIndex = null)}
                      aria-label={`${formatShortDate(point.date)}: ${point.logins} logins`}
                    ></button>
                  </div>
                  {#if hoveredLoginIndex === index}
                    <div
                      class={`pointer-events-none absolute bottom-16 z-20 w-44 rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground shadow-xl ${
                        index > points.length - 5 ? "right-0" : "left-1/2 -translate-x-1/2"
                      }`}
                    >
                      <div class="mb-2 font-semibold">
                        {formatDate(point.date)}
                      </div>
                      <div class="flex items-center justify-between gap-3">
                        <span class="inline-flex items-center gap-2">
                          <span class="h-2.5 w-2.5 rounded-sm bg-emerald-500"></span>
                          Successful logins
                        </span>
                        <span class="font-semibold">{point.logins}</span>
                      </div>
                    </div>
                  {/if}
                  {#if index === 0 || index === points.length - 1 || index % 7 === 0}
                    <div class="w-14 truncate text-center text-[10px] text-muted-foreground">
                      {formatShortDate(point.date)}
                    </div>
                  {:else}
                    <div class="h-[14px]"></div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="mt-2 pl-[3.75rem] text-[11px] text-muted-foreground">
          Bar height = successful logins per day.
        </div>
      </div>
    {/if}
  </section>

  <section class="admin-panel">
    <div class="admin-panel-header">
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Users</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {totalUsers} matching account{totalUsers === 1 ? "" : "s"}.
        </p>
      </div>

      <div class="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
        <input
          class="admin-control w-full sm:w-80"
          bind:value={userQuery}
          oninput={scheduleUserSearch}
          placeholder="Search users..."
          aria-label="Search users by name or email"
        />
        {#if userQuery.trim()}
          <a href="/admin/dashboard" data-sveltekit-noscroll class="admin-button text-center">
            Clear
          </a>
        {/if}
      </div>
    </div>

    <div class="border-b border-border/60 px-5 py-3 text-xs text-muted-foreground">
      Page {userPage + 1} of {totalUserPages}
    </div>

    {#if users.length === 0}
      <div class="p-6 text-sm text-muted-foreground">No users found.</div>
    {:else}
      <div class="overflow-x-auto">
        <table class="admin-table min-w-[980px]">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Provider</th>
              <th>Activity</th>
              <th>Joined</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as user}
              <tr class="align-top">
                <td>
                  <div class="font-medium">{user.name || "Unnamed user"}</div>
                  <div class="mt-1 text-xs text-muted-foreground">{user.email}</div>
                  <div class="mt-2">
                    <span
                      class={`inline-flex rounded-md border px-2 py-0.5 text-[11px] ${
                        user.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    class={`inline-flex rounded-md border px-2 py-0.5 text-xs ${
                      user.is_admin
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "border-border bg-background/40 text-muted-foreground"
                    }`}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </span>
                </td>
                <td class="capitalize text-muted-foreground">
                  {user.auth_provider || "unknown"}
                </td>
                <td>
                  <div class="flex flex-wrap gap-2 text-xs">
                    <span class="rounded-md border border-border bg-background/40 px-2 py-1">
                      {user.bets} bets
                    </span>
                    <span class="rounded-md border border-border bg-background/40 px-2 py-1">
                      {user.deposits} deposits
                    </span>
                    <span class="rounded-md border border-border bg-background/40 px-2 py-1">
                      {user.wallet_accounts} wallets
                    </span>
                  </div>
                </td>
                <td class="text-muted-foreground">
                  <div>{formatDate(user.created_at)}</div>
                  <div class="mt-1 text-xs">Last login: {formatDate(user.last_login_at)}</div>
                </td>
                <td>
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="admin-button px-3 py-1.5 text-xs"
                      onclick={() =>
                        (expandedUserId = expandedUserId === user.id ? null : user.id)}
                    >
                      {expandedUserId === user.id ? "Hide" : "View"}
                    </button>

                    <form method="post" action="?/setUserStatus">
                      <input type="hidden" name="user_id" value={user.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={user.is_active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        disabled={user.is_admin}
                        class={`rounded-md border px-3 py-1.5 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          user.is_active
                            ? "border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                        }`}
                        onclick={(event) => {
                          const action = user.is_active ? "Deactivate" : "Activate";
                          if (
                            !confirm(
                              `${action} ${user.email}? ${
                                user.is_active
                                  ? "They will no longer be able to log in."
                                  : "They will be able to log in again."
                              }`,
                            )
                          ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>

              {#if expandedUserId === user.id}
                <tr>
                  <td colspan="6" class="bg-background/30">
                    <div class="grid gap-3 text-xs text-muted-foreground md:grid-cols-3">
                      <div>
                        <div class="font-medium text-foreground">User ID</div>
                        <div class="mt-1 break-all">{user.id}</div>
                      </div>
                      <div>
                        <div class="font-medium text-foreground">Created</div>
                        <div class="mt-1">{formatDate(user.created_at)}</div>
                      </div>
                      <div>
                        <div class="font-medium text-foreground">Last login</div>
                        <div class="mt-1">{formatDate(user.last_login_at)}</div>
                      </div>
                    </div>
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    <div class="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm">
      <a
        href={userPageHref(Math.max(0, userPage - 1))}
        data-sveltekit-noscroll
        class={`admin-button px-3 py-1.5 ${
          userPage === 0 ? "pointer-events-none opacity-40" : ""
        }`}
      >
        Previous
      </a>

      <span class="text-muted-foreground">
        Page {userPage + 1} of {totalUserPages}
      </span>

      <a
        href={userPageHref(userPage + 1)}
        data-sveltekit-noscroll
        class={`admin-button px-3 py-1.5 ${
          (userPage + 1) * userPageSize >= totalUsers
            ? "pointer-events-none opacity-40"
            : ""
        }`}
      >
        Next
      </a>
    </div>
  </section>
</div>
