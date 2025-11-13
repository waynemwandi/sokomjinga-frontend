<!-- src/routes/(auth)/login/+page.svelte -->
<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { ChartNoAxesCombined } from "lucide-svelte";

  // from +page.server.ts
  export let data: { googleStartUrl: string; mode: "login" | "signup" };

  // initialise from server-rendered mode
  let mode: "login" | "signup" = data.mode;

  const isLogin = () => mode === "login";

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-2 text-sm border transition text-center select-none ${
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-input text-muted-foreground border-border hover:bg-accent"
    }`;
</script>

<div
  class="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4"
>
  <div class="w-full max-w-sm">
    <a href="/" class="mb-4 flex items-center gap-2 font-medium">
      <div
        class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
      >
        <ChartNoAxesCombined class="h-4 w-4" />
      </div>
      SokoMjinga
    </a>

    <Card.Root>
      <!-- Tabs: force a full reload so server re-runs with the new mode -->
      <div class="px-6 pt-6 flex items-center gap-2">
        <a
          href="/login?mode=login"
          data-sveltekit-reload
          class={tabClass(isLogin())}
        >
          Sign In
        </a>

        <a
          href="/login?mode=signup"
          data-sveltekit-reload
          class={tabClass(!isLogin())}
        >
          Sign Up
        </a>
      </div>

      <Card.Header class="text-center">
        <Card.Title class="text-xl">
          {isLogin() ? "Welcome back" : "Create your account"}
        </Card.Title>
        <Card.Description>
          {isLogin() ? "Continue with Google" : "Start with Google"}
        </Card.Description>
      </Card.Header>

      <Card.Content>
        {#if isLogin()}
          <form method="post" action="?/login" class="grid gap-6">
            <!-- Colorful Google button -->
            <a
              href={data.googleStartUrl}
              class="w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
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
              <span class="text-gray-800">Continue with Google</span>
            </a>

            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border"
            >
              <span class="bg-card text-muted-foreground relative z-10 px-2"
                >Or continue with</span
              >
            </div>

            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  class="border border-accent"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
              <div class="grid gap-2">
                <div class="flex items-center">
                  <Label for="password">Password</Label>
                  <a
                    href="##"
                    class="ml-auto text-sm underline-offset-4 hover:underline"
                    >Forgot password?</a
                  >
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  class="border border-accent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" class="w-full">Log In</Button>
            </div>
          </form>
        {:else}
          <form method="post" action="?/signup" class="grid gap-6">
            <a
              href={data.googleStartUrl}
              class="w-full inline-flex items-center justify-center gap-3 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                aria-hidden="true"
              >
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
              <span class="text-gray-800">Sign up with Google</span>
            </a>

            <div
              class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border"
            >
              <span class="bg-card text-muted-foreground relative z-10 px-2"
                >Or continue with</span
              >
            </div>

            <div class="grid gap-4">
              <div class="grid gap-2">
                <Label for="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  class="border border-accent"
                  placeholder="example@gmail.com"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  class="border border-accent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  name="confirm"
                  type="password"
                  class="border border-accent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div class="grid gap-2">
                <Label for="name">Name (optional)</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  class="border border-accent"
                  placeholder="Wayne"
                />
              </div>

              <Button type="submit" class="w-full">Create account</Button>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>

    <div class="text-muted-foreground text-balance text-center text-xs mt-4">
      By continuing you agree to our
      <a class="underline underline-offset-4" href="/admin/dashboard"
        >Terms of Service</a
      >
      and
      <a class="underline underline-offset-4" href="/privacy">Privacy Policy</a
      >.
    </div>
  </div>
</div>
