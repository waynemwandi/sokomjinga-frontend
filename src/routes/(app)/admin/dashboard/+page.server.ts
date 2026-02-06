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

type AuthPoint = {
  date: string;
  logins: number;
};

type AuthSeries = {
  days: number;
  points: AuthPoint[];
};

export const load: PageServerLoad = async ({ fetch }) => {
  const statsRes = await fetch(`${BASE}/admin/stats`);
  const seriesRes = await fetch(`${BASE}/admin/auth/timeseries?days=30`);

  return {
    stats: statsRes.ok ? ((await statsRes.json()) as Stats) : null,
    authSeries: seriesRes.ok
      ? ((await seriesRes.json()) as {
          days: number;
          points: { date: string; logins: number }[];
        })
      : null,
  };
};
