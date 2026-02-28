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
    <h1 class="text-3xl font-bold mb-4">Terms and Conditions</h1>

    <p class="text-sm text-muted-foreground mb-10">
      Last updated: {lastUpdated}
    </p>

    <div class="space-y-8 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h2 class="font-semibold text-foreground mb-2">1. Introduction</h2>
        <p>
          These Terms and Conditions govern your access to and use of
          MaoniMarket. By creating an account or participating in any market,
          you agree to these terms.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">2. Eligibility</h2>
        <p>
          You must be at least 18 years old and legally permitted to use this
          platform under the laws of your jurisdiction.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">3. How Markets Work</h2>
        <p>
          Users trade Yes/No shares on the outcome of future events. Prices may
          change in real time and markets resolve based on predefined criteria.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">4. Risk Disclosure</h2>
        <p>Trading involves risk. You may lose part or all of your funds.</p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">
          5. Wallet and Payments
        </h2>
        <p>
          Deposits and withdrawals are processed via supported payment
          providers. You are responsible for ensuring accuracy of your payment
          details.
        </p>
      </div>

      <div>
        <h2 class="font-semibold text-foreground mb-2">6. Governing Law</h2>
        <p>These Terms are governed by the laws of the Republic of Kenya.</p>
      </div>
    </div>

    <div
      class="mt-12 pt-6 border-t border-border/50 text-xs text-muted-foreground"
    >
      Version 0.1 — Early Access Platform
    </div>
  </div>
</div>
