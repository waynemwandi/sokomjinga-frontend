// src/routes/(app)/admin/dashboard/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";

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

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch(`${BASE}/admin/stats`);

  if (!res.ok) {
    // fallback so the page still renders if the API is down
    return { stats: null };
  }

  const stats = (await res.json()) as Stats;
  return { stats };
};
