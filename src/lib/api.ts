// src/lib/api.ts
import { env as publicEnv } from "$env/dynamic/public";
export const API_BASE = publicEnv.PUBLIC_API_BASE || "/api";

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(
    `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`
  );
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
