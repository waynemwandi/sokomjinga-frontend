// src/hooks.server.ts
import type { Handle } from "@sveltejs/kit";
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";
import { dev } from "$app/environment";

// Base URL resolution (Docker SSR -> PRIVATE_API_BASE; otherwise PUBLIC_API_BASE; else localhost)
const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

// Cookie options for (re)setting the access token after a successful refresh
const cookieOpts = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !dev,
  maxAge: 60 * 60, // 1 hour
};

export const handle: Handle = async ({ event, resolve }) => {
  const access = event.cookies.get("access_token");
  const refresh = event.cookies.get("refresh_token");

  // default
  event.locals.accessToken = access || undefined;
  event.locals.isAuthed = false;

  // If we have an access token, validate it
  if (access) {
    try {
      const me = await fetch(`${BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${access}`,
          accept: "application/json",
        },
      });

      if (me.ok) {
        event.locals.isAuthed = true;
        return resolve(event);
      }

      // If access token is invalid/expired, try a silent refresh if we have a refresh token
      if (me.status === 401 && refresh) {
        const r = await fetch(`${BASE}/auth/refresh`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({ refresh_token: refresh }),
        });

        if (r.ok) {
          const body = await r.json();
          const newAccess = String(body?.access_token || "");

          if (newAccess) {
            // update cookie and locals
            event.cookies.set("access_token", newAccess, cookieOpts);
            event.locals.accessToken = newAccess;
            event.locals.isAuthed = true;
            return resolve(event);
          }
        }

        // Refresh failed: fall through to unauthenticated state
        // Optionally clear stale access cookie
        event.cookies.set("access_token", "", { ...cookieOpts, maxAge: 0 });
      }
    } catch {
      // Network/other error: continue unauthenticated
    }
  } else if (refresh) {
    // No access token but we DO have a refresh token -> try refresh proactively
    try {
      const r = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (r.ok) {
        const body = await r.json();
        const newAccess = String(body?.access_token || "");
        if (newAccess) {
          event.cookies.set("access_token", newAccess, cookieOpts);
          event.locals.accessToken = newAccess;
          event.locals.isAuthed = true;
        }
      }
    } catch {
      // ignore
    }
  }

  return resolve(event);
};
