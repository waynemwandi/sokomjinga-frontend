// src/routes/(app)/account/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { redirect, error } from "@sveltejs/kit";

// Same base resolution pattern as elsewhere
const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async ({ locals, fetch, url }) => {
  // must be logged in
  if (!locals.accessToken) {
    const redirectTo = encodeURIComponent(url.pathname);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const headers = {
    Authorization: `Bearer ${locals.accessToken}`,
    accept: "application/json",
  };

  // Fetch everything in parallel
  const [userRes, statsRes, betsRes, positionsRes] = await Promise.all([
    fetch(`${BASE}/auth/me`, { headers }),
    fetch(`${BASE}/me/stats`, { headers }),
    fetch(`${BASE}/me/bets`, { headers }),
    fetch(`${BASE}/me/positions`, { headers }),
  ]);

  // Auth guard
  if (userRes.status === 401) {
    const redirectTo = encodeURIComponent(url.pathname);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  if (!userRes.ok) {
    throw error(
      500,
      `Failed to load profile: ${userRes.status} ${userRes.statusText}`
    );
  }

  const user = await userRes.json();

  // The others are "best effort" – if they fail we just show empty/defaults
  const stats = statsRes.ok ? await statsRes.json().catch(() => null) : null;
  const bets = betsRes.ok ? await betsRes.json().catch(() => []) : [];
  const positions = positionsRes.ok
    ? await positionsRes.json().catch(() => [])
    : [];

  return {
    user,
    stats,
    bets,
    positions,
  };
};
