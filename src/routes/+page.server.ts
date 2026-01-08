// src/routes/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as pub } from "$env/dynamic/public";
import { env as priv } from "$env/dynamic/private";

/**
 * Join helper that behaves with/without slashes.
 */
const join = (a: string, b: string) =>
  `${a.replace(/\/$/, "")}/${b.replace(/^\//, "")}`;

export const load: PageServerLoad = async ({ locals, url }) => {
  const selectedCategory = url.searchParams.get("category") ?? "All markets";
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

  // Normalize API response for UI consumption (image_url, volume, safe defaults)
  const normalized = Array.isArray(markets)
    ? markets.map((m) => {
        const volumeCents = m.volume_cents ?? 0;

        const volumeLabel =
          volumeCents > 0
            ? new Intl.NumberFormat("en-KE", {
                style: "currency",
                currency: "KES",
                currencyDisplay: "code",
                maximumFractionDigits: 0,
              }).format(volumeCents / 100)
            : null;

        return {
          ...m,
          image_url: m.image_url ?? m.img ?? null,
          volume_cents: volumeCents,
          volume_label: volumeLabel,
        };
      })
    : [];

  return {
    isAuthed: locals.isAuthed,
    markets: normalized,
    selectedCategory,
  };
};
