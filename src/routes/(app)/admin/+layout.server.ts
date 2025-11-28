// src/routes/(app)/admin/+layout.server.ts
import type { LayoutServerLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: LayoutServerLoad = async ({ cookies, fetch }) => {
  const access = cookies.get("access_token");
  const refresh = cookies.get("refresh_token");

  // No tokens at all? Bounce to login
  if (!access && !refresh) throw redirect(302, "/login");

  // Call /auth/me and verify is_admin
  const r = await fetch(`${BASE}/auth/me`, {
    headers: {
      // works whether your API reads cookie or Authorization header
      authorization: access ? `Bearer ${access}` : "",
      "content-type": "application/json",
      // If BASE is same-origin proxy (/api), cookies will be forwarded automatically.
      // If it's a different origin, also forward cookie header:
      cookie: [
        access ? `access_token=${access}` : "",
        refresh ? `refresh_token=${refresh}` : "",
      ]
        .filter(Boolean)
        .join("; "),
    },
    credentials: "include",
  });

  if (!r.ok) throw redirect(302, "/login");
  const me = await r.json();
  if (!me?.is_admin) throw redirect(302, "/");

  return { me, accessToken: access };
};
