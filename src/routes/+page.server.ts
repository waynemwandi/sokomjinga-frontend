// src/routes/+page.server.ts
import type { PageServerLoad } from "./$types";
import { env as pub } from "$env/dynamic/public";
import { env as priv } from "$env/dynamic/private";

const join = (a: string, b: string) =>
  `${a.replace(/\/$/, "")}/${b.replace(/^\//, "")}`;

export const load: PageServerLoad = async () => {
  // Prefer container-to-container URL for SSR; fall back to public if set absolute
  const serverBase =
    priv.PRIVATE_API_BASE ||
    (pub.PUBLIC_API_BASE?.startsWith("/")
      ? "http://api:8000"
      : pub.PUBLIC_API_BASE || "http://api:8000");

  const res = await fetch(join(serverBase, "/markets"), {
    headers: { accept: "application/json" },
  });
  if (!res.ok)
    throw new Error(`GET /markets failed: ${res.status} ${res.statusText}`);

  const markets = await res.json();
  return { isAuthed: false, markets };
};
