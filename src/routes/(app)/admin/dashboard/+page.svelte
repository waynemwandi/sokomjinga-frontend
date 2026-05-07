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
  };

  const s = data.stats;
  const points = data.authSeries?.points ?? [];
  const users = data.users?.items ?? [];
  const userPage = data.userPage ?? 0;
  const userPageSize = data.userPageSize ?? 10;
  const totalUsers = data.users?.total ?? 0;
  const totalUserPages = Math.max(1, Math.ceil(totalUsers / userPageSize));
  const maxLogins = Math.max(1, ...points.map((p) => p.logins));
  const totalChartLogins = points.reduce((sum, p) => sum + p.logins, 0);
  const activeDays = points.filter((p) => p.logins > 0).length;
  const peakPoint =
    points.length > 0
      ? points.reduce((max, p) => (p.logins > max.logins ? p : max), points[0])
      : null;

  let expandedUserId: string | null = null;

  const cards = s
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
</script>

<div class="space-y-8">
  <div>
    <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
    <p class="mt-1 text-sm text-muted-foreground">
      Monitor account growth, login activity, and user access.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
    {#each cards as c}
      <div
        class="rounded-xl border border-border bg-card/80 p-5 shadow-sm transition-colors hover:border-primary/40"
      >
        <div class="text-sm text-muted-foreground">{c.title}</div>
        <div class="mt-3 text-3xl font-semibold tracking-tight">{c.value}</div>
        {#if c.note}
          <div class="mt-2 text-xs text-muted-foreground">{c.note}</div>
        {/if}
      </div>
    {/each}
  </div>

  <section class="rounded-xl border border-border bg-card/80 p-5 shadow-sm">
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
      <div class="h-56 rounded-xl border border-border/60 bg-background/30 p-4">
        <div class="flex h-full items-end gap-1">
          {#each points as point, index}
            <div class="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div class="flex h-40 w-full items-end">
                <div
                  class="mx-auto w-full max-w-7 rounded-t bg-emerald-500/80 transition-all"
                  title={`${formatShortDate(point.date)}: ${point.logins} logins`}
                  style={`height: ${barHeight(point.logins)}`}
                ></div>
              </div>
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
    {/if}
  </section>

  <section class="rounded-xl border border-border bg-card/80 shadow-sm">
    <div
      class="flex flex-col gap-2 border-b border-border/60 p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <h2 class="text-lg font-semibold tracking-tight">Users</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          {totalUsers} accounts in MaoniMarket.
        </p>
      </div>
      <div class="text-xs text-muted-foreground">
        Page {userPage + 1} of {totalUserPages}
      </div>
    </div>

    {#if users.length === 0}
      <div class="p-6 text-sm text-muted-foreground">No users found.</div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="border-b border-border/60 text-xs text-muted-foreground">
            <tr>
              <th class="px-5 py-3 font-medium">User</th>
              <th class="px-5 py-3 font-medium">Role</th>
              <th class="px-5 py-3 font-medium">Provider</th>
              <th class="px-5 py-3 font-medium">Activity</th>
              <th class="px-5 py-3 font-medium">Joined</th>
              <th class="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border/60">
            {#each users as user}
              <tr class="align-top">
                <td class="px-5 py-4">
                  <div class="font-medium">{user.name || "Unnamed user"}</div>
                  <div class="mt-1 text-xs text-muted-foreground">{user.email}</div>
                  <div class="mt-2">
                    <span
                      class={`inline-flex rounded-md border px-2 py-0.5 text-[11px] ${
                        user.is_active
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : "border-red-500/30 bg-red-500/10 text-red-400"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4">
                  <span
                    class={`inline-flex rounded-md border px-2 py-0.5 text-xs ${
                      user.is_admin
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        : "border-border bg-background/40 text-muted-foreground"
                    }`}
                  >
                    {user.is_admin ? "Admin" : "User"}
                  </span>
                </td>
                <td class="px-5 py-4 capitalize text-muted-foreground">
                  {user.auth_provider || "unknown"}
                </td>
                <td class="px-5 py-4">
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
                <td class="px-5 py-4 text-muted-foreground">
                  <div>{formatDate(user.created_at)}</div>
                  <div class="mt-1 text-xs">Last login: {formatDate(user.last_login_at)}</div>
                </td>
                <td class="px-5 py-4">
                  <div class="flex justify-end gap-2">
                    <button
                      type="button"
                      class="rounded-md border border-border bg-background/40 px-3 py-1.5 text-xs hover:bg-accent"
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
                            ? "border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                        onclick={(event) => {
                          const action = user.is_active
                            ? "Deactivate"
                            : "Activate";
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
                  <td colspan="6" class="bg-background/30 px-5 py-4">
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

    <div
      class="flex items-center justify-between border-t border-border/60 px-5 py-4 text-sm"
    >
      <a
        href={`?page=${Math.max(0, userPage - 1)}`}
        class={`rounded-md border border-border px-3 py-1.5 transition ${
          userPage === 0
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent"
        }`}
      >
        Previous
      </a>

      <span class="text-muted-foreground">
        Page {userPage + 1} of {totalUserPages}
      </span>

      <a
        href={`?page=${userPage + 1}`}
        class={`rounded-md border border-border px-3 py-1.5 transition ${
          (userPage + 1) * userPageSize >= totalUsers
            ? "pointer-events-none opacity-40"
            : "hover:bg-accent"
        }`}
      >
        Next
      </a>
    </div>
  </section>
</div>
