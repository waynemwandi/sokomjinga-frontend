import type { Actions, PageServerLoad } from "./$types";
import { redirect, error } from "@sveltejs/kit";
import { Markets, Wallet } from "$lib/api.server";

export const load: PageServerLoad = async ({ params, locals }) => {
  const id = params.id;

  const [market, priceHistory, wallet] = await Promise.all([
    Markets.get(id),
    Markets.priceHistory(id),
    locals.accessToken
      ? Wallet.me({
          headers: {
            Authorization: `Bearer ${locals.accessToken}`,
            accept: "application/json",
          },
        }).catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    isAuthed: Boolean(locals.accessToken),
    accessToken: locals.accessToken ?? null,
    market,
    outcomes: market.outcomes ?? [],
    priceHistory,
    wallet,
  };
};

export const actions: Actions = {
  buy: async ({ request, params, locals }) => {
    if (!locals.accessToken) {
      throw redirect(302, `/login?redirect=/market/${params.id}`);
    }

    const fd = await request.formData();
    const side = String(fd.get("side") ?? "yes"); // "yes" | "no"
    const shares = Number(fd.get("shares") ?? "1");
    const priceCents = Number(fd.get("price_cents") ?? "0");

    if (!shares || shares <= 0 || !priceCents || priceCents <= 0) {
      throw error(400, "Invalid order details");
    }

    const amountCents = shares * priceCents;

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
        `/portfolio?deposit=1&amount=${encodeURIComponent(amountKes)}`
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
      }
    );

    // back to same market page; SvelteKit will re-run load
    return { success: true };
  },
};
