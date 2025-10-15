<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Label } from "$lib/components/ui/label";
  import { Input } from "$lib/components/ui/input";
  import { ChartNoAxesCombined } from "lucide-svelte";

  let mode: "login" | "signup" = "login";
  const isLogin = () => mode === "login";
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
      <!-- Tabs -->
      <div class="px-6 pt-6 flex items-center gap-2">
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm border transition
					{isLogin()
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-input text-muted-foreground border-border hover:bg-accent'}"
          on:click={() => (mode = "login")}
        >
          Sign In
        </button>
        <button
          class="flex-1 rounded-md px-3 py-2 text-sm border transition
					{!isLogin()
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-input text-muted-foreground border-border hover:bg-accent'}"
          on:click={() => (mode = "signup")}
        >
          Sign Up
        </button>
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
        <form class="grid gap-6" on:submit|preventDefault>
          <!-- Google first -->
          <Button variant="secondary" class="w-full border border-border">
            <!-- Monochrome Google 'G' -->
            <svg
              viewBox="0 0 24 24"
              class="mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.03 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z"
              />
            </svg>
            {isLogin() ? "Continue with Google" : "Sign up with Google"}
          </Button>

          <!-- Divider -->
          <div
            class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border"
          >
            <span class="bg-card text-muted-foreground relative z-10 px-2"
              >Or continue with</span
            >
          </div>

          <!-- Form fields -->
          <div class="grid gap-4">
            <!-- Email / password / phone fields -->
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                type="email"
                class="border border-accent"
                placeholder="example@gmail.com"
              />
            </div>
            <div class="grid gap-2">
              <div class="flex items-center">
                <Label for="password">Password</Label>
                {#if isLogin()}
                  <a
                    href="##"
                    class="ml-auto text-sm underline-offset-4 hover:underline"
                    >Forgot password?</a
                  >
                {/if}
              </div>
              <Input
                id="password"
                type="password"
                class="border border-accent"
                placeholder="••••••••"
              />
            </div>

            {#if !isLogin()}
              <div class="grid gap-2">
                <Label for="confirm">Confirm Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  class="border border-accent"
                  placeholder="••••••••"
                />
              </div>
            {/if}

            <Button type="submit" class="w-full">
              {isLogin() ? "Log In" : "Create account"}
            </Button>
          </div>

          <!-- Switch link -->
          <div class="text-center text-sm">
            {#if isLogin()}
              Don’t have an account?
              <button
                type="button"
                class="underline underline-offset-4"
                on:click={() => (mode = "signup")}
              >
                Sign up
              </button>
            {:else}
              Already have an account?
              <button
                type="button"
                class="underline underline-offset-4"
                on:click={() => (mode = "login")}
              >
                Log in
              </button>
            {/if}
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <div class="text-muted-foreground text-balance text-center text-xs mt-4">
      By continuing, you agree to our
      <a class="underline underline-offset-4" href="/admin/dashboard"
        >Terms of Service</a
      >
      and
      <a class="underline underline-offset-4" href="/privacy">Privacy Policy</a
      >.
    </div>
  </div>
</div>
