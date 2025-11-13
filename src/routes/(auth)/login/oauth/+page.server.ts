// src/routes/(auth)/login/oauth/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { redirect, fail } from "@sveltejs/kit";

const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

export const load: PageServerLoad = async (event) => {
  const { url, cookies, fetch } = event;
  const code = url.searchParams.get("code");
  if (!code) throw redirect(302, "/login");

  const r = await fetch(
    `${BASE}/auth/google/exchange?code=${encodeURIComponent(code)}`
  );
  if (!r.ok) return fail(400, { message: await r.text() });

  const body = (await r.json()) as {
    access_token: string;
    refresh_token: string;
  };

  const base = {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
  cookies.set("access_token", body.access_token, { ...base, maxAge: 60 * 60 });
  cookies.set("refresh_token", body.refresh_token, {
    ...base,
    maxAge: 60 * 60 * 24 * 30,
  });

  throw redirect(302, "/");
};
