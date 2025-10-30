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
        {#if isLogin()}
          <!-- LOGIN FORM -->
          <form method="post" action="?/login" class="grid gap-6">
            <Button
              type="button"
              variant="secondary"
              class="w-full border border-border"
            >
              <!-- Google button (stub) -->
              <!-- ... -->
              Continue with Google
            </Button>

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
          <!-- SIGNUP FORM -->
          <form method="post" action="?/signup" class="grid gap-6">
            <Button
              type="button"
              variant="secondary"
              class="w-full border border-border"
            >
              <!-- Google button (stub) -->
              Sign up with Google
            </Button>

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
              <!-- Optional name -->
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

        <!-- Switch link stays the same -->
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
