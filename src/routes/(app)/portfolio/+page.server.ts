// src/routes/(app)/portfolio/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { redirect, fail } from "@sveltejs/kit";
import { Wallet, Me } from "$lib/api.server";

export const load: PageServerLoad = async ({ locals }) => {
  const accessToken = locals.accessToken;

  if (!accessToken) {
    const redirectTo = encodeURIComponent("/portfolio");
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const authInit = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  };

  const [wallet, bets] = await Promise.all([
    Wallet.get(authInit),
    Me.bets(authInit),
  ]);

  return {
    wallet,
    bets,
  };
};

export const actions: Actions = {
  deposit: async ({ request, locals }) => {
    const accessToken = locals.accessToken;

    if (!accessToken) {
      const redirectTo = encodeURIComponent("/portfolio");
      throw redirect(302, `/login?redirect=${redirectTo}`);
    }

    const fd = await request.formData();
    const amountStr = (fd.get("amount") as string | null) ?? "";
    const amount = Number(amountStr);

    if (!Number.isFinite(amount) || amount <= 0) {
      return fail(400, {
        error: "Enter a valid deposit amount in KES",
        amount: amountStr,
      });
    }

    const amount_cents = Math.round(amount * 100);

    const authInit = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
      },
    };

    try {
      // Simulate waiting for STK push & callback from Safaricom
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await Wallet.deposit({ amount_cents }, authInit);

      throw redirect(303, "/portfolio?deposit_success=1");
    } catch (err: any) {
      return fail(500, {
        error: err?.message ?? "Failed to initiate deposit",
        amount: amountStr,
      });
    }
  },
};
