import { PUBLIC_API_BASE } from "$env/static/public";

export const API_BASE = PUBLIC_API_BASE;

export async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
