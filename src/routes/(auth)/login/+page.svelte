<!-- src/routes/(auth)/login/+page.svelte -->
<script lang="ts">
  import GoogleAuthCard from "$lib/components/layout/GoogleAuthCard.svelte";

  export let data: { googleStartUrl: string; mode: "login" | "signup" };
</script>

<div
  class="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4"
>
  <GoogleAuthCard googleStartUrl={data.googleStartUrl} compact />
</div>
