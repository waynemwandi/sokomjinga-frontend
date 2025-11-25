// src/routes/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as pub } from "$env/dynamic/public";
import { env as priv } from "$env/dynamic/private";

/**
 * Join helper that behaves with/without slashes.
 */
const join = (a: string, b: string) =>
  `${a.replace(/\/$/, "")}/${b.replace(/^\//, "")}`;

export const load: PageServerLoad = async ({ locals }) => {
  // Prefer container-to-container URL for SSR; fall back to public if absolute
  const serverBase =
    priv.PRIVATE_API_BASE ||
    (pub.PUBLIC_API_BASE?.startsWith("/")
      ? "http://api:8000"
      : pub.PUBLIC_API_BASE || "http://api:8000");

  // Fetch the markets list for the homepage grid.
  const res = await fetch(join(serverBase, "/markets"), {
    headers: { accept: "application/json" },
    // Avoid caching during active development; feel free to remove later.
    cache: "no-store",
  });

  if (!res.ok) {
    // Surfacing a clear error in dev
    throw new Error(`GET /markets failed: ${res.status} ${res.statusText}`);
  }

  const markets = await res.json();

  // Optional: normalize keys used by the UI (ensure image_url exists)
  const normalized = Array.isArray(markets)
    ? markets.map((m) => ({
        ...m,
        image_url: m.image_url ?? m.img ?? null,
      }))
    : [];

  return {
    isAuthed: locals.isAuthed,
    markets: normalized,
  };
};
