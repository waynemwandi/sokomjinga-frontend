// src/lib/api.ts
import { env as publicEnv } from "$env/dynamic/public";

// Prefer PUBLIC_API_BASE if set, else "/api"
const BASE = (publicEnv.PUBLIC_API_BASE || "/api").replace(/\/+$/, "");

async function j<T>(path: string, init?: RequestInit): Promise<T> {
  // merge headers first, then spread init, so we never lose content-type
  const headers = {
    "content-type": "application/json",
    ...(init?.headers || {}),
  };

  const res = await fetch(`${BASE}${path}`, {
    ...(init || {}),
    headers,
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

  // CHANGE THIS
  create: (payload: any, accessToken?: string) =>
    j<any>("/markets", {
      method: "POST",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),

  update: (id: string, payload: any, accessToken?: string) =>
    j<any>(`/markets/${id}`, {
      method: "PUT",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),

  del: (id: string, accessToken?: string) =>
    j<void>(`/markets/${id}`, {
      method: "DELETE",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),

  close: (id: string, accessToken?: string) =>
    j<any>(`/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "closed" }),
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),
};

/** Outcomes */
export const Outcomes = {
  create: (marketId: string, payload: any, accessToken?: string) =>
    j<any>(`/markets/${marketId}/outcomes`, {
      method: "POST",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),

  update: (
    marketId: string,
    outcomeId: string,
    payload: any,
    accessToken?: string
  ) =>
    j<any>(`/markets/${marketId}/outcomes/${outcomeId}`, {
      method: "PUT",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),

  del: (marketId: string, outcomeId: string, accessToken?: string) =>
    j<void>(`/markets/${marketId}/outcomes/${outcomeId}`, {
      method: "DELETE",
      headers: accessToken
        ? {
            Authorization: `Bearer ${accessToken}`,
          }
        : undefined,
    }),
};
