// src/lib/api.ts
import { env as publicEnv } from "$env/dynamic/public";

const BASE = (publicEnv.PUBLIC_API_BASE || "/api").replace(/\/+$/, "");

async function j<T>(path: string, init?: RequestInit): Promise<T> {
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
      `${res.status} ${res.statusText}${text ? `: ${text}` : ""}`,
    );
  }

  if (res.status === 204) return undefined as T;

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export const API_BASE = BASE;
export const getJSON = j;

/* ===============================
WALLET (client)
================================= */

export const Wallet = {
  me: () => j<{ balance_cents: number; currency: string }>("/wallet/me"),

  get: () => j<{ balance_cents: number; currency: string }>("/wallet/me"),

  deposit: async (payload: { amount_cents: number }) => {
    const created = await j<{
      id: string;
      status: string;
      amount_cents: number;
      currency: string;
    }>("/wallet/deposits", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const confirmed = await j<{
      id: string;
      status: string;
      amount_cents: number;
      currency: string;
    }>(`/wallet/deposits/${created.id}/confirm`, {
      method: "POST",
      body: JSON.stringify({
        mpesa_reference: `DEV-${Date.now()}`,
        mpesa_phone: null,
      }),
    });

    return confirmed;
  },

  depositSTK: async (payload: { amount_cents: number }) =>
    j<{
      id: string;
      status: string;
      amount_cents: number;
      currency: string;
    }>("/wallet/deposits", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

/* ===============================
MARKETS
================================= */

export const Markets = {
  list: () => j<any[]>("/markets"),
  get: (id: string) => j<any>(`/markets/${id}`),

  create: (payload: any, accessToken?: string) =>
    j<any>("/markets", {
      method: "POST",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),

  update: (id: string, payload: any, accessToken?: string) =>
    j<any>(`/markets/${id}`, {
      method: "PUT",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),

  del: (id: string, accessToken?: string) =>
    j<void>(`/markets/${id}`, {
      method: "DELETE",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),

  close: (id: string, accessToken?: string) =>
    j<any>(`/markets/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "closed" }),
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),
};

/* ===============================
OUTCOMES
================================= */

export const Outcomes = {
  create: (marketId: string, payload: any, accessToken?: string) =>
    j<any>(`/markets/${marketId}/outcomes`, {
      method: "POST",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),

  update: (
    marketId: string,
    outcomeId: string,
    payload: any,
    accessToken?: string,
  ) =>
    j<any>(`/markets/${marketId}/outcomes/${outcomeId}`, {
      method: "PUT",
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),

  del: (marketId: string, outcomeId: string, accessToken?: string) =>
    j<void>(`/markets/${marketId}/outcomes/${outcomeId}`, {
      method: "DELETE",
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined,
    }),
};

/* ===============================
PROFILE (client)
================================= */

export const Profile = {
  me: () =>
    j<{
      user_id: string;
      phone_e164: string | null;
      phone_verified: boolean;
    }>("/profile/me"),

  setPhone: (phone_e164: string) =>
    j<{
      user_id: string;
      phone_e164: string | null;
      phone_verified: boolean;
    }>("/profile/phone", {
      method: "PUT",
      body: JSON.stringify({ phone_e164 }),
    }),
};
