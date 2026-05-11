// src/routes/(public)/market/[id]/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { Markets, Me, Wallet } from "$lib/api.server";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const id = params.id;

  const authHeaders = locals.accessToken
    ? {
        Authorization: `Bearer ${locals.accessToken}`,
        accept: "application/json",
      }
    : null;

  const [market, priceHistory, wallet, userBets] = await Promise.all([
    Markets.get(id),
    Markets.priceHistory(id),
    authHeaders
      ? Wallet.me({ headers: authHeaders }).catch(() => null)
      : Promise.resolve(null),
    authHeaders
      ? Me.bets({ headers: authHeaders }).catch(() => [])
      : Promise.resolve(null),
  ]);

  const side = url.searchParams.get("side");
  const initialSide =
    side === "yes" || side === "no" ? (side as "yes" | "no") : null;

  return {
    isAuthed: Boolean(locals.accessToken),
    accessToken: locals.accessToken ?? null,
    market,
    outcomes: market.outcomes ?? [],
    priceHistory,
    wallet,
    marketBets: Array.isArray(userBets)
      ? userBets.filter((bet: any) => String(bet.market_id ?? "") === id)
      : [],
    initialSide,
  };
};

export const actions: Actions = {
  buy: async ({ request, params, locals }) => {
    if (!locals.accessToken) {
      throw redirect(302, `/login?redirect=/market/${params.id}`);
    }

    const fd = await request.formData();
    const side = String(fd.get("side") ?? "yes"); // "yes" | "no"
    const amountCents = Number(fd.get("amount_cents") ?? "0");

    if (!amountCents || amountCents <= 0) {
      throw error(400, "Invalid amount");
    }

    // 1) check wallet balance
    const wallet = await Wallet.me({
      headers: {
        Authorization: `Bearer ${locals.accessToken}`,
        accept: "application/json",
      },
    });

    if (wallet.balance_cents < amountCents) {
      const amountKes = (amountCents / 100).toFixed(0);
      // redirect to portfolio deposit modal with suggested amount
      throw redirect(
        303,
        `/portfolio?deposit=1&amount=${encodeURIComponent(amountKes)}`,
      );
    }

    // 2) resolve outcome id from side
    const market = await Markets.get(params.id, {
      headers: {
        Authorization: `Bearer ${locals.accessToken}`,
        accept: "application/json",
      },
    });

    const outcomes = market.outcomes ?? [];
    const outcome = outcomes.find((o: any) => {
      const label = (o.label ?? "").toLowerCase().trim();
      if (side === "yes") return label === "yes" || label === "true";
      if (side === "no") return label === "no" || label === "false";
      return false;
    });

    if (!outcome) {
      throw error(400, "Outcome not found");
    }

    // 3) place bet
    await Markets.placeBet(
      params.id,
      {
        outcome_id: outcome.id,
        amount_cents: amountCents,
      },
      {
        headers: {
          Authorization: `Bearer ${locals.accessToken}`,
          accept: "application/json",
        },
      },
    );

    // 4) fetch updated wallet AFTER bet
    const updatedWallet = await Wallet.me({
      headers: {
        Authorization: `Bearer ${locals.accessToken}`,
        accept: "application/json",
      },
    });

    // return new balance to frontend
    return {
      success: true,
      wallet_balance_cents: updatedWallet.balance_cents ?? 0,
    };
  },
};
