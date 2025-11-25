<!-- src/routes/(app)/account/+page.svelte -->
<script lang="ts">
  export let data: {
    user: any;
  };

  const u = data.user ?? {};
  const profile = u.profile ?? u.user_profile ?? {};
</script>

<main class="mx-auto w-full max-w-[800px] px-4 md:px-6 py-8">
  <h1 class="text-2xl font-semibold mb-6">My Account</h1>

  <section class="rounded-xl border border-border bg-card p-5 space-y-4">
    <div>
      <h2 class="text-sm font-semibold text-muted-foreground">Name</h2>
      <p class="mt-1 text-base">{u.name ?? "—"}</p>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-muted-foreground">Email</h2>
      <p class="mt-1 text-base">{u.email ?? "—"}</p>
    </div>

    <div>
      <h2 class="text-sm font-semibold text-muted-foreground">Auth Provider</h2>
      <p class="mt-1 text-base">
        {profile.auth_provider ?? "password"}
      </p>
    </div>

    {#if profile.avatar_url}
      <div class="flex items-center gap-3">
        <div>
          <h2 class="text-sm font-semibold text-muted-foreground">Avatar</h2>
          <p class="mt-1 text-xs text-muted-foreground">
            Managed via your Google account.
          </p>
        </div>
        <img
          src={profile.avatar_url}
          alt="Avatar"
          class="h-12 w-12 rounded-full object-cover border border-border"
        />
      </div>
    {/if}

    {#if u.created_at}
      <div>
        <h2 class="text-sm font-semibold text-muted-foreground">
          Member Since
        </h2>
        <p class="mt-1 text-base">
          {new Date(u.created_at).toLocaleDateString("en-KE", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    {/if}
  </section>
</main>
