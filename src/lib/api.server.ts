// src/lib/api.server.ts
// server-only API client
import { env as priv } from "$env/dynamic/private";
import { env as pub } from "$env/dynamic/public";

// Order of precedence:
// 1) PRIVATE_API_BASE (Docker: "http://api:8000")
// 2) PUBLIC_API_BASE (works if absolute, e.g. "http://127.0.0.1:8000")
// 3) sensible local default
const BASE = (
  priv.PRIVATE_API_BASE ||
  pub.PUBLIC_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/+$/, "");

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `${res.status} ${res.statusText}${body ? `: ${body}` : ""}`
    );
  }
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// Markets API - CRUD and close
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

// Market Outcomes API - CRUD
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
