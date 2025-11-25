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
    // optional: remember where we wanted to go
    const redirectTo = encodeURIComponent(url.pathname);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  const res = await fetch(`${BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${locals.accessToken}`,
      accept: "application/json",
    },
  });

  if (res.status === 401) {
    const redirectTo = encodeURIComponent(url.pathname);
    throw redirect(302, `/login?redirect=${redirectTo}`);
  }

  if (!res.ok) {
    throw error(500, `Failed to load profile: ${res.status} ${res.statusText}`);
  }

  const user = await res.json(); // whatever shape your /auth/me returns

  return {
    user,
  };
};
