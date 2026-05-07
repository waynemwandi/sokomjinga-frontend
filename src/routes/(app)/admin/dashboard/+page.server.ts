// src/routes/(app)/admin/dashboard/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { fail, type Actions } from "@sveltejs/kit";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

type Stats = {
  total_users: number;
  signups_last_7d: number;
  logins_today: number;
  logins_last_7d: number;
  logins_by_provider: Record<string, number>;
};

type AuthPoint = {
  date: string;
  logins: number;
};

type AuthSeries = {
  days: number;
  points: AuthPoint[];
};

type AdminUser = {
  id: string;
  email: string;
  name: string | null;
  is_active: boolean;
  is_admin: boolean;
  auth_provider: string | null;
  created_at: string;
  last_login_at: string | null;
  wallet_accounts: number;
  bets: number;
  deposits: number;
};

type AdminUsers = {
  items: AdminUser[];
  total: number;
  limit: number;
  offset: number;
};

const authHeaders = (access: string | undefined): Record<string, string> =>
  access ? { authorization: `Bearer ${access}` } : {};

const PAGE_SIZE = 10;

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
  const access = cookies.get("access_token");
  const headers = authHeaders(access);
  const page = Math.max(0, Number(url.searchParams.get("page") ?? "0") || 0);
  const offset = page * PAGE_SIZE;

  const statsRes = await fetch(`${BASE}/admin/stats`, { headers });
  const seriesRes = await fetch(`${BASE}/admin/auth/timeseries?days=30`, {
    headers,
  });
  const usersRes = await fetch(
    `${BASE}/admin/users?limit=${PAGE_SIZE}&offset=${offset}`,
    { headers },
  );

  return {
    stats: statsRes.ok ? ((await statsRes.json()) as Stats) : null,
    authSeries: seriesRes.ok
      ? ((await seriesRes.json()) as {
          days: number;
          points: { date: string; logins: number }[];
        })
      : null,
    users: usersRes.ok ? ((await usersRes.json()) as AdminUsers) : null,
    userPage: page,
    userPageSize: PAGE_SIZE,
  };
};

export const actions: Actions = {
  setUserStatus: async ({ cookies, fetch, request }) => {
    const access = cookies.get("access_token");
    const form = await request.formData();
    const userId = String(form.get("user_id") || "");
    const isActive = String(form.get("is_active") || "") === "true";

    if (!userId) return fail(400, { message: "Missing user id" });

    const res = await fetch(`${BASE}/admin/users/${userId}/status`, {
      method: "PATCH",
      headers: {
        ...authHeaders(access),
        "content-type": "application/json",
      },
      body: JSON.stringify({ is_active: isActive }),
    });

    if (!res.ok) return fail(res.status, { message: await res.text() });

    return { ok: true };
  },
};
