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

  const requestInit = {
    headers: { accept: "application/json" },
    cache: "no-store",
  } as const;

  const [marketsRes, questionsRes] = await Promise.all([
    fetch(join(serverBase, "/markets"), requestInit),
    fetch(join(serverBase, "/market-questions"), requestInit),
  ]);

  if (!marketsRes.ok) {
    throw new Error(`GET /markets failed: ${marketsRes.status} ${marketsRes.statusText}`);
  }
  if (!questionsRes.ok) {
    throw new Error(
      `GET /market-questions failed: ${questionsRes.status} ${questionsRes.statusText}`,
    );
  }

  const [markets, questions] = await Promise.all([
    marketsRes.json(),
    questionsRes.json(),
  ]);

  // Normalize API response for UI consumption (image_url, volume, safe defaults)
  const normalizedMarkets = Array.isArray(markets)
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
          kind: "market",
          image_url: m.image_url ?? m.img ?? null,
          volume_cents: volumeCents,
          volume_label: volumeLabel,
        };
      })
    : [];

  const normalizedQuestions = Array.isArray(questions)
    ? questions.map((q) => ({
        ...q,
        kind: "question",
        image_url: q.image_url ?? null,
        volume_cents: q.volume_cents ?? 0,
      }))
    : [];

  return {
    isAuthed: locals.isAuthed,
    markets: [...normalizedQuestions, ...normalizedMarkets],
    selectedCategory,
  };
};
