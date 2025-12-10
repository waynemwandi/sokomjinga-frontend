// src/routes/+layout.server.ts
import type { LayoutServerLoad } from "./$types";
import { Wallet } from "$lib/api.server";

export const load: LayoutServerLoad = async ({ locals }) => {
  const accessToken = locals.accessToken;
  const isAuthed = locals.isAuthed;

  let portfolioLabel: string | null = null;

  if (isAuthed && accessToken) {
    try {
      const wallet = await Wallet.me({
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
      });

      // wallet: { balance_cents: number; currency: string }
      const amount = (wallet.balance_cents ?? 0) / 100;

      const formatted = new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: wallet.currency || "KES",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);

      // This will render like: "Portfolio KES 3,000.00"
      portfolioLabel = `Portfolio ${formatted}`;
    } catch (err) {
      // If /wallet/me fails for any reason, fall back to default label
      portfolioLabel = null;
    }
  }

  return {
    isAuthed,
    accessToken: accessToken ?? null,
    portfolioLabel, // might be null if unauth or wallet call failed
  };
};
