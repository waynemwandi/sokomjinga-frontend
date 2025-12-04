// src/routes/(app)/portfolio/+page.server.ts
import type { PageServerLoad, Actions } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { redirect, error, fail } from "@sveltejs/kit";
import { Wallet } from "$lib/api.server";

// Same base resolution pattern as elsewhere
const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  const token = locals.accessToken;

  // Must be logged in
  if (!token) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    accept: "application/json",
  };

  // Fetch wallet + bets + positions
  const [walletRes, betsRes, positionsRes] = await Promise.all([
    fetch(`${BASE}/wallet/me`, { headers }),
    fetch(`${BASE}/me/bets`, { headers }),
    fetch(`${BASE}/me/positions`, { headers }),
  ]);

  if (walletRes.status === 401) {
    const redirectTo = encodeURIComponent(url.pathname + url.search);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  if (!walletRes.ok) {
    throw error(
      500,
      `Failed to load wallet: ${walletRes.status} ${walletRes.statusText}`
    );
  }

  const wallet = await walletRes.json();
  const bets = betsRes.ok ? await betsRes.json().catch(() => []) : [];
  const positions = positionsRes.ok
    ? await positionsRes.json().catch(() => null)
    : null;

  // For navbar link /portfolio?deposit
  const openDeposit = url.searchParams.get("deposit");

  return {
    wallet,
    bets,
    positions,
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
      await Wallet.deposit(
        { amount_cents },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
