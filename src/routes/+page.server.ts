// src/routes/+page.server.ts
import type { PageServerLoad } from "./$types";
import { PUBLIC_API_BASE } from "$env/static/public";

export const load: PageServerLoad = async ({ fetch }) => {
  // TODO: Auth
  const isAuthed = false;
  const base = (PUBLIC_API_BASE ?? "").trim().replace(/\/$/, "");
  const url = base ? `${base}/markets` : "/markets";

  let markets: any[] = [];
  try {
    const res = await fetch(url);
    if (res.ok) markets = await res.json();
  } catch (e) {
    console.error("load(/) markets failed:", e);
  }
  return { isAuthed: false, markets };
};
