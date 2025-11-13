// src/routes/(auth)/login/+page.server.ts
import type { Actions, PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { fail, redirect } from "@sveltejs/kit";
import { dev } from "$app/environment";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const isProd = !dev;

export const load: PageServerLoad = async ({ cookies, fetch, url }) => {
  const access = cookies.get("access_token");
  const refresh = cookies.get("refresh_token");

  // If already authed, bounce
  if (access) {
    const r = await fetch(`${BASE}/auth/me`, {
      headers: { authorization: `Bearer ${access}` },
    });
    if (r.ok) throw redirect(302, "/");
  }

  if (refresh) {
    const rr = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (rr.ok) throw redirect(302, "/");
  }

  // derive mode from querystring
  const mode = url.searchParams.get("mode") === "signup" ? "signup" : "login";

  // expose Google start URL and current mode
  return { googleStartUrl: `${BASE}/auth/google/start`, mode };
};

export const actions: Actions = {
  signup: async ({ request, cookies }) => {
    const fd = await request.formData();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const confirm = String(fd.get("confirm") || "");
    const name = String(fd.get("name") || "").trim() || null;

    if (!email || !password) return fail(400, { message: "Missing fields" });
    if (confirm && confirm !== password)
      return fail(400, { message: "Passwords do not match" });

    // 1) create user
    const s = await fetch(`${BASE}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    if (!s.ok) return fail(s.status, { message: await s.text() });

    // 2) login
    const r = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) return fail(r.status, { message: await r.text() });

    const body = await r.json();
    setAuthCookies(cookies, body.access_token, body.refresh_token, isProd);
    throw redirect(302, "/");
  },

  login: async ({ request, cookies }) => {
    const fd = await request.formData();
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    if (!email || !password) return fail(400, { message: "Missing fields" });

    const r = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!r.ok) return fail(r.status, { message: await r.text() });

    const body = await r.json();
    setAuthCookies(cookies, body.access_token, body.refresh_token, isProd);
    throw redirect(302, "/");
  },

  logout: async ({ cookies }) => {
    clearAuthCookies(cookies, isProd);
    throw redirect(302, "/");
  },
};

function setAuthCookies(
  cookies: import("@sveltejs/kit").Cookies,
  access: string,
  refresh?: string,
  prod = false
) {
  const base = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: prod,
    maxAge: 60 * 60,
  };
  cookies.set("access_token", access, base);
  if (refresh)
    cookies.set("refresh_token", refresh, {
      ...base,
      maxAge: 60 * 60 * 24 * 30,
    });
}

function clearAuthCookies(
  cookies: import("@sveltejs/kit").Cookies,
  prod = false
) {
  const base = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: prod,
    maxAge: 0,
  };
  cookies.set("access_token", "", base);
  cookies.set("refresh_token", "", base);
}
