// src/routes/(app)/admin/wallets/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { fail } from "@sveltejs/kit";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ fetch, locals, url }) => {
  const page = Number(url.searchParams.get("page") ?? "0");
  const withdrawalPage = Number(url.searchParams.get("withdrawalsPage") ?? "0");
  const withdrawalStatus = url.searchParams.get("withdrawalStatus") ?? "pending";
  const PAGE_SIZE = 10;
  const WITHDRAWAL_PAGE_SIZE = 10;
  const offset = page * PAGE_SIZE;
  const withdrawalOffset = withdrawalPage * WITHDRAWAL_PAGE_SIZE;
  const headers = locals.accessToken
    ? { Authorization: `Bearer ${locals.accessToken}` }
    : undefined;

  const [summaryRes, byTypeRes, walletsRes, withdrawalsRes] = await Promise.all([
    fetch(`${BASE}/admin/wallets/summary`, { headers }),
    fetch(`${BASE}/admin/wallets/by-type`, { headers }),
    fetch(`${BASE}/admin/wallets?limit=${PAGE_SIZE}&offset=${offset}`, { headers }),
    fetch(
      `${BASE}/admin/withdrawals?status=${encodeURIComponent(withdrawalStatus)}&limit=${WITHDRAWAL_PAGE_SIZE}&offset=${withdrawalOffset}`,
      { headers },
    ),
  ]);

  if (!summaryRes.ok || !byTypeRes.ok || !walletsRes.ok) {
    return {
      summary: null,
      byType: [],
      wallets: [],
      total: 0,
      page,
      withdrawals: [],
      withdrawalsTotal: 0,
      withdrawalPage,
      withdrawalStatus,
    };
  }

  const walletsJson = await walletsRes.json();
  const withdrawalsJson = withdrawalsRes.ok
    ? await withdrawalsRes.json()
    : { items: [], total: 0 };

  return {
    summary: await summaryRes.json(),
    byType: await byTypeRes.json(),
    wallets: walletsJson.items,
    total: walletsJson.total,
    page,
    withdrawals: withdrawalsJson.items,
    withdrawalsTotal: withdrawalsJson.total,
    withdrawalPage,
    withdrawalStatus,
  };
};

export const actions: Actions = {
  updateWithdrawal: async ({ request, locals, fetch }) => {
    if (!locals.accessToken) {
      return fail(401, { error: "Not authenticated" });
    }

    const fd = await request.formData();
    const id = String(fd.get("id") || "");
    const status = String(fd.get("status") || "");
    const mpesa_reference = String(fd.get("mpesa_reference") || "").trim();
    const reason = String(fd.get("reason") || "").trim();

    const res = await fetch(`${BASE}/admin/withdrawals/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${locals.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        status,
        mpesa_reference: mpesa_reference || null,
        reason: reason || null,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return fail(res.status, {
        error: text || "Could not update withdrawal",
      });
    }

    return { ok: true };
  },
};
