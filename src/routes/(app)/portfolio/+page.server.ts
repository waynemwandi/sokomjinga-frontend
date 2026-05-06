// src/routes/(app)/portfolio/+page.server.ts
import type { PageServerLoad, Actions } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { redirect, error, fail } from "@sveltejs/kit";
import { Me, Wallet } from "$lib/api.server";

// Same base resolution pattern as elsewhere
const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  const token = locals.accessToken;

  if (!token) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };

  const [stats, bets, positions, walletRes] = await Promise.all([
    Me.stats({ headers }),
    Me.bets({ headers }),
    Me.positions({ headers }),
    fetch(`${BASE}/wallet/me`, { headers }),
  ]);

  if (!walletRes.ok) {
    throw error(
      500,
      `Failed to load wallet: ${walletRes.status} ${walletRes.statusText}`,
    );
  }

  const wallet = await walletRes.json();
  const openDeposit = url.searchParams.get("deposit");

  return {
    stats,
    bets,
    positions,
    wallet,
    openDeposit,
  };
};

export const actions: Actions = {
  // POST from the DepositModal form (action="?/deposit")
  deposit: async ({ request, locals }) => {
    const token = locals.accessToken;

    if (!token) {
      throw redirect(302, "/login");
    }

    const form = await request.formData();
    const rawAmount = form.get("amount");

    const amountKes =
      typeof rawAmount === "string" ? parseFloat(rawAmount) : NaN;

    if (!amountKes || !Number.isFinite(amountKes) || amountKes <= 0) {
      return fail(400, {
        error: "Enter a valid deposit amount in KES.",
        amount: rawAmount ?? "",
      });
    }

    const amount_cents = Math.round(amountKes * 100);

    try {
      // Dev-only auto-confirm deposit (via Wallet.deposit helper)
      // await Wallet.deposit(
      //   { amount_cents },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${token}`,
      //     },
      //   },
      // );

      // Production flow: create pending STK push, user confirms on phone, then wallet is updated via webhook. No need to auto-confirm here.
      const created = await Wallet.depositSTK(
        { amount_cents },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      // Let SvelteKit reload the page and show updated balance/history
      return { success: true };
    } catch (e: any) {
      console.error("Deposit failed:", e);
      return fail(500, {
        error: e?.message || "Deposit failed. Please try again.",
      });
    }
  },
};
