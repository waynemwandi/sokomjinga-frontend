<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Label } from '$lib/components/ui/label';
  import { Input } from '$lib/components/ui/input';
  import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
  const id = 'login';
</script>

<!-- Use design tokens so it looks good in light (and dark if user toggled) -->
<div class="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-4">
  <div class="w-full max-w-sm">
    <a href="/" class="mb-4 flex items-center gap-2 font-medium">
      <div class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
        <GalleryVerticalEndIcon class="size-4" />
      </div>
      SokoMjinga
    </a>

    <Card.Root>
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Login with your Google account</Card.Description>
      </Card.Header>

      <Card.Content>
        <form class="grid gap-6">
          <div class="flex flex-col gap-4">
            <Button variant="outline" class="w-full">
              <!-- GitHub mark -->
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="mr-2 h-4 w-4" fill="currentColor">
                <path fill-rule="evenodd" clip-rule="evenodd"
                  d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.72 1.26 3.39.96.1-.75.41-1.26.74-1.55-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.18 3.16-1.18.62 1.58.23 2.75.12 3.04.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.41-5.25 5.69.42.37.8 1.09.8 2.21v3.27c0 .3.21.65.8.55A10.98 10.98 0 0 0 23.5 12c0-6.35-5.15-11.5-11.5-11.5Z"/>
              </svg>
              Login with GitHub
            </Button>

            <Button variant="outline" class="w-full">
              <!-- Google G (simple monocolor) -->
              <svg viewBox="0 0 24 24" class="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.19-1.79 4.13-1.15 1.15-2.93 2.4-6.03 2.4-4.83 0-8.6-3.89-8.6-8.72s3.77-8.72 8.6-8.72c2.6 0 4.51 1.03 5.91 2.35l2.31-2.31C18.75 1.44 16.13 0 12.48 0 5.87 0 .31 5.39.31 12s5.56 12 12.17 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.05-1.47-.17-2.05H12.48z"/>
              </svg>
              Login with Google
            </Button>
          </div>

          <div class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:flex after:items-center after:border-t after:border-border">
            <span class="bg-card text-muted-foreground relative z-10 px-2">Or continue with</span>
          </div>

          <div class="grid gap-6">
            <div class="grid gap-3">
              <Label for={"email-"+id}>Email</Label>
              <Input id={"email-"+id} type="email" placeholder="email@example.com" required />
            </div>
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for={"password-"+id}>Password</Label>
                <a href="##" class="ml-auto text-sm underline-offset-4 hover:underline">Forgot your password?</a>
              </div>
              <Input id={"password-"+id} type="password" required />
            </div>
            <Button type="submit" class="w-full">Login</Button>
          </div>

          <div class="text-center text-sm">
            Don&apos;t have an account? <a href="##" class="underline underline-offset-4">Sign up</a>
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <div class="text-muted-foreground text-balance text-center text-xs mt-4">
      By clicking continue, you agree to our <a class="underline underline-offset-4" href="##">Terms of Service</a>
      and <a class="underline underline-offset-4" href="##">Privacy Policy</a>.
    </div>
  </div>
</div>
