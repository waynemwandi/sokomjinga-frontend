// src/lib/api.ts
import { env as publicEnv } from "$env/dynamic/public";

// Prefer PUBLIC_API_BASE if set, else "/api"
const BASE = (publicEnv.PUBLIC_API_BASE || "/api").replace(/\/+$/, "");

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${text ? `: ${text}` : ""}`
    );
  }

  // Handle 204 or non-JSON bodies safely
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export const API_BASE = BASE;
export const getJSON = j;

/** Markets */
export const Markets = {
  list: () => j<any[]>("/markets"),
  get: (id: string) => j<any>(`/markets/${id}`),
  create: (payload: any) =>
    j<any>("/markets", { method: "POST", body: JSON.stringify(payload) }),
  update: (id: string, payload: any) =>
    j<any>(`/markets/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  del: (id: string) => j<void>(`/markets/${id}`, { method: "DELETE" }),
  close: (id: string) =>
    j<any>(`/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "closed" }),
    }),
};

/** Outcomes */
export const Outcomes = {
  create: (marketId: string, payload: any) =>
    j<any>(`/markets/${marketId}/outcomes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (marketId: string, outcomeId: string, payload: any) =>
    j<any>(`/markets/${marketId}/outcomes/${outcomeId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  del: (marketId: string, outcomeId: string) =>
    j<void>(`/markets/${marketId}/outcomes/${outcomeId}`, { method: "DELETE" }),
};
