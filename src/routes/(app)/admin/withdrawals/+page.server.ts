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
  const status = url.searchParams.get("status") ?? "pending";
  const PAGE_SIZE = 10;
  const offset = page * PAGE_SIZE;
  const headers = locals.accessToken
    ? { Authorization: `Bearer ${locals.accessToken}` }
    : undefined;

  const res = await fetch(
    `${BASE}/admin/withdrawals?status=${encodeURIComponent(status)}&limit=${PAGE_SIZE}&offset=${offset}`,
    { headers },
  );

  if (!res.ok) {
    return {
      withdrawals: [],
      total: 0,
      page,
      pageSize: PAGE_SIZE,
      status,
    };
  }

  const json = await res.json();

  return {
    withdrawals: json.items,
    total: json.total,
    page,
    pageSize: PAGE_SIZE,
    status,
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
