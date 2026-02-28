<script lang="ts">
  import { ChartNoAxesCombined } from "lucide-svelte";

  const lastUpdated = "March 2026";
</script>

<div class="mx-auto max-w-3xl px-4 py-20">
  <div class="flex justify-center mb-12">
    <a href="/" class="flex items-center gap-2 font-medium text-lg">
      <div
        class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
      >
        <ChartNoAxesCombined class="h-4 w-4" />
      </div>
      MaoniMarket
    </a>
  </div>
  <div
    class="rounded-2xl border border-border/60
           bg-card/80 backdrop-blur-md
           shadow-xl shadow-black/20
           p-8 sm:p-12"
  >
    <h1 class="text-3xl font-bold mb-4">Privacy Policy</h1>

    <p class="text-sm text-muted-foreground mb-10">
      Last updated: {lastUpdated}
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h2 class="font-semibold text-foreground mb-2">
          1. Information We Collect
        </h2>
        <p>
          We collect information necessary to provide our services, including
          account details, transaction history, and payment information.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">
          2. How We Use Information
        </h2>
        <p>
          We use your information to operate the platform, process deposits and
          withdrawals, improve user experience, and comply with legal
          obligations.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">3. Data Security</h2>
        <p>
          We implement reasonable technical and organizational measures to
          protect your information from unauthorized access or disclosure.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">
          4. Sharing of Information
        </h2>
        <p>
          We may share information with payment providers, service partners, or
          authorities when required by law.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">5. Your Rights</h2>
        <p>
          You may request access, correction, or deletion of your personal
          information subject to applicable laws.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">6. Contact</h2>
        <p>
          For privacy-related inquiries, please contact support through the
          platform.
        </p>
      </div>
    </div>

    <div
      class="mt-12 pt-6 border-t border-border/50 text-xs text-muted-foreground"
    >
      Version 0.1 — Early Access Platform
    </div>
  </div>
</div>
