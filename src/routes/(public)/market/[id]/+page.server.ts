import type { PageServerLoad } from "./$types";
import { env as pub } from "$env/dynamic/public";
import { env as priv } from "$env/dynamic/private";
import { error } from "@sveltejs/kit";

/** Safe join that ignores duplicate slashes */
const join = (a: string, b: string) =>
  `${a.replace(/\/$/, "")}/${b.replace(/^\//, "")}`;

export const load: PageServerLoad = async ({ params, fetch }) => {
  // Use the same base resolution as the homepage so SSR works in dev/docker
  const serverBase =
    priv.PRIVATE_API_BASE ||
    (pub.PUBLIC_API_BASE?.startsWith("/")
      ? "http://api:8000"
      : pub.PUBLIC_API_BASE || "http://api:8000");

  const url = join(serverBase, `/markets/${encodeURIComponent(params.id)}`);

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    // Bubble a nice error page but keep the status code
    throw error(res.status, "Market not found");
  }

  const market = await res.json();

  return {
    market,
    outcomes: Array.isArray(market?.outcomes) ? market.outcomes : [],
  };
};
