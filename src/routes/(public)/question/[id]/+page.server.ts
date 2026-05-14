// src/routes/(public)/question/[id]/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { error, redirect } from "@sveltejs/kit";
import { MarketQuestions, Markets, Me, Wallet } from "$lib/api.server";

export const load: PageServerLoad = async ({ params, locals, url }) => {
  const authHeaders = locals.accessToken
    ? {
        Authorization: `Bearer ${locals.accessToken}`,
        accept: "application/json",
      }
    : null;

  const question = await MarketQuestions.get(params.id);
  const selectedMarketId = url.searchParams.get("option");
  const side = url.searchParams.get("side");

  const [wallet, userBets] = await Promise.all([
    authHeaders
      ? Wallet.me({ headers: authHeaders }).catch(() => null)
      : Promise.resolve(null),
    authHeaders
      ? Me.bets({ headers: authHeaders }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const childIds = new Set((question.options ?? []).map((o: any) => o.market_id));

  return {
    isAuthed: Boolean(locals.accessToken),
    accessToken: locals.accessToken ?? null,
    question,
    wallet,
    initialMarketId: selectedMarketId,
    initialSide: side === "no" ? "no" : "yes",
    marketBets: Array.isArray(userBets)
      ? userBets.filter((bet: any) => childIds.has(String(bet.market_id ?? "")))
      : [],
  };
};

export const actions: Actions = {
  buy: async ({ request, params, locals }) => {
    if (!locals.accessToken) {
      throw redirect(302, `/login?redirect=/question/${params.id}`);
    }

    const fd = await request.formData();
    const marketId = String(fd.get("market_id") ?? "");
    const side = String(fd.get("side") ?? "yes");
    const amountCents = Number(fd.get("amount_cents") ?? "0");

    if (!marketId) throw error(400, "Option is required");
    if (!amountCents || amountCents <= 0) throw error(400, "Invalid amount");

    const headers = {
      Authorization: `Bearer ${locals.accessToken}`,
      accept: "application/json",
    };

    const wallet = await Wallet.me({ headers });
    if (wallet.balance_cents < amountCents) {
      const amountKes = (amountCents / 100).toFixed(0);
      throw redirect(
        303,
        `/portfolio?deposit=1&amount=${encodeURIComponent(amountKes)}`,
      );
    }

    const question = await MarketQuestions.get(params.id, { headers });
    const option = (question.options ?? []).find(
      (o: any) => String(o.market_id) === marketId,
    );
    if (!option) throw error(400, "Option does not belong to this question");

    const outcomeId =
      side === "no" ? option.no_outcome_id : option.yes_outcome_id;
    if (!outcomeId) throw error(400, "Outcome not found");

    await Markets.placeBet(
      marketId,
      {
        outcome_id: outcomeId,
        amount_cents: amountCents,
      },
      { headers },
    );

    const updatedWallet = await Wallet.me({ headers });
    return {
      success: true,
      wallet_balance_cents: updatedWallet.balance_cents ?? 0,
    };
  },
};
