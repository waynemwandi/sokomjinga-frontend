// src/routes/(app)/admin/wallets/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const headers = locals.accessToken
    ? { Authorization: `Bearer ${locals.accessToken}` }
    : undefined;

  try {
    const [summaryRes, byTypeRes] = await Promise.all([
      fetch(`${BASE}/admin/wallets/summary`, { headers }),
      fetch(`${BASE}/admin/wallets/by-type`, { headers }),
    ]);

    if (!summaryRes.ok || !byTypeRes.ok) {
      return {
        summary: null,
        byType: [],
      };
    }

    const [summary, byTypeJson] = await Promise.all([
      summaryRes.json(),
      byTypeRes.json(),
    ]);

    return {
      summary,
      byType: Array.isArray(byTypeJson) ? byTypeJson : [],
    };
  } catch {
    return {
      summary: null,
      byType: [],
    };
  }
};
