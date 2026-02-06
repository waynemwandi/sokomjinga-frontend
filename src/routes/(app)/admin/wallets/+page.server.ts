// src/routes/(app)/admin/wallets/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ fetch, url }) => {
  const page = Number(url.searchParams.get("page") ?? "0");
  const PAGE_SIZE = 10;
  const offset = page * PAGE_SIZE;

  const [summaryRes, byTypeRes, walletsRes] = await Promise.all([
    fetch(`${BASE}/admin/wallets/summary`),
    fetch(`${BASE}/admin/wallets/by-type`),
    fetch(`${BASE}/admin/wallets?limit=${PAGE_SIZE}&offset=${offset}`),
  ]);

  if (!summaryRes.ok || !byTypeRes.ok || !walletsRes.ok) {
    return {
      summary: null,
      byType: [],
      wallets: [],
      total: 0,
      page,
    };
  }

  const walletsJson = await walletsRes.json();

  return {
    summary: await summaryRes.json(),
    byType: await byTypeRes.json(),
    wallets: walletsJson.items,
    total: walletsJson.total,
    page,
  };
};
