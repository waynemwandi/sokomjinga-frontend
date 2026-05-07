<script lang="ts">
  export let googleStartUrl: string;
  export let compact = false;
</script>

<div
  class={`w-full overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl ${
    compact ? "max-w-md" : ""
  }`}
>
  <div class="border-b border-border/60 px-6 py-5 text-center">
    <h2 class="text-2xl font-semibold tracking-tight">
      Welcome to MaoniMarket
    </h2>
    <p class="mt-2 text-sm text-muted-foreground">
      Continue with Google to access your account.
    </p>
  </div>

  <div class="space-y-4 px-6 py-6">
    <a
      href={googleStartUrl}
      class="inline-flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M9 7.32v3.06h4.35c-.19 1.11-1.32 3.26-4.35 3.26A5.04 5.04 0 0 1 3.96 8.7 5.04 5.04 0 0 1 9 3.66c1.44 0 2.4.6 2.95 1.11l2.01-1.95A8.25 8.25 0 0 0 9 .75 8.25 8.25 0 1 0 17.25 9c0-.57-.06-1.02-.15-1.47H9z"
        />
        <path
          fill="#4285F4"
          d="M1.5 5.52l2.47 1.81A5.04 5.04 0 0 1 9 3.66c1.44 0 2.4.6 2.95 1.11l2.01-1.95A8.25 8.25 0 0 0 9 .75 8.24 8.24 0 0 0 1.5 5.52z"
        />
        <path
          fill="#FBBC05"
          d="M9 17.25c2.7 0 4.96-.9 6.6-2.46l-2.43-1.99c-.67.48-1.56.81-2.67.81-3.03 0-4.16-2.15-4.35-3.26H1.8v2.06A8.24 8.24 0 0 0 9 17.25z"
        />
        <path
          fill="#34A853"
          d="M2.97 11.35A7.88 7.88 0 0 1 2.7 9c0-.81.14-1.59.39-2.3L1.5 4.98A8.24 8.24 0 0 0 1.8 12.6l1.17-1.25z"
        />
      </svg>
      Continue with Google
    </a>

    <div class="text-center text-xs text-muted-foreground">
      By continuing you agree to our
      <a class="underline underline-offset-4 hover:text-foreground" href="/terms">
        Terms
      </a>
      and
      <a
        class="underline underline-offset-4 hover:text-foreground"
        href="/privacy"
      >
        Privacy
      </a>.
    </div>
  </div>
</div>
